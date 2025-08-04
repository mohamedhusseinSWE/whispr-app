# Stripe Production Setup Guide

This guide will walk you through setting up Stripe for production use in your Whispr PDF application. Follow these steps carefully to ensure your payment system works correctly in production.

## 📋 Prerequisites

Before starting, make sure you have:
- A Stripe account (create one at [stripe.com](https://stripe.com))
- Access to your Stripe Dashboard
- Your application deployed and ready for production
- Environment variables configured

## 🚀 Step-by-Step Setup Guide

### Step 1: Create Stripe Account & Get API Keys

1. **Sign up for Stripe**
   - Go to [stripe.com](https://stripe.com) and create an account
   - Complete the verification process
   - Add your business information

2. **Get Your API Keys**
   - Log into your Stripe Dashboard
   - Go to **Developers** → **API Keys**
   - Copy your **Publishable Key** and **Secret Key**
   - **Important**: Make sure you're in **LIVE** mode (not test mode)

### Step 2: Configure Environment Variables

Add these environment variables to your production environment:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_your_live_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Application Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key_here
```

### Step 3: Create Products in Stripe Dashboard

1. **Go to Products in Stripe Dashboard**
   - Navigate to **Products** → **Add Product**

2. **Create Free Plan Product**
   - **Name**: "Whispr PDF Free Plan"
   - **Description**: "Free plan with limited features"
   - **Price**: $0.00
   - **Billing**: One-time
   - **Save the product**

3. **Create Pro Plan Product**
   - **Name**: "Whispr PDF Pro Plan"
   - **Description**: "Pro plan with unlimited features"
   - **Price**: $14.00/month
   - **Billing**: Recurring (monthly)
   - **Save the product**

### Step 4: Get Product and Price IDs

1. **For Free Plan**:
   - Click on the Free Plan product
   - Copy the **Product ID** (starts with `prod_`)
   - Copy the **Price ID** (starts with `price_`)

2. **For Pro Plan**:
   - Click on the Pro Plan product
   - Copy the **Product ID** (starts with `prod_`)
   - Copy the **Price ID** (starts with `price_`)

### Step 5: Update Your Configuration File

Update the `src/app/config/stripe.ts` file with your production price IDs:

```typescript
export const PLANS = [
  {
    name: "Free",
    slug: "free",
    quota: 10,
    pagesPerPdf: 8,
    price: {
      amount: 0,
      priceIds: {
        test: "",
        production: "", // Leave empty for free plan
      },
    },
  },
  {
    name: "Pro",
    slug: "pro",
    quota: 50,
    pagesPerPdf: 25,
    price: {
      amount: 14,
      priceIds: {
        test: "price_1RmQzPCd54QIP0qutag9E8vX", // Keep for development
        production: "price_YOUR_LIVE_PRO_PRICE_ID_HERE", // Add your live price ID
      },
    },
  },
];
```

### Step 6: Set Up Webhooks

1. **Create Webhook Endpoint**
   - Go to **Developers** → **Webhooks** in Stripe Dashboard
   - Click **Add endpoint**
   - **Endpoint URL**: `https://yourdomain.com/api/webhooks/stripe`
   - **Events to send**: Select these events:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`

2. **Get Webhook Secret**
   - After creating the webhook, click on it
   - Go to **Signing secret**
   - Click **Reveal** and copy the secret
   - Add it to your environment variables as `STRIPE_WEBHOOK_SECRET`

## 🔗 Detailed Webhook Usage Guide for Mr. AMS

### What Are Webhooks?

Webhooks are automated messages sent from Stripe to your application when specific events occur. Think of them as "notifications" that tell your app when something important happens with payments or subscriptions.

### How Webhooks Work in Whispr PDF

1. **Customer subscribes to Pro plan** → Stripe sends webhook → Your app updates user's subscription status
2. **Payment fails** → Stripe sends webhook → Your app downgrades user to free plan
3. **Customer cancels** → Stripe sends webhook → Your app removes premium features

### Webhook Events You Need to Handle

#### 1. `customer.subscription.created`
**When it happens**: New customer subscribes to Pro plan
**What to do**: 
- Update user's subscription status in database
- Grant access to premium features
- Send welcome email
- Update user's quota limits

#### 2. `customer.subscription.updated`
**When it happens**: Subscription details change (plan upgrade/downgrade, billing cycle changes)
**What to do**:
- Update subscription details in database
- Adjust user's quota and features
- Send notification email about changes

#### 3. `customer.subscription.deleted`
**When it happens**: Customer cancels subscription or subscription expires
**What to do**:
- Downgrade user to free plan
- Remove premium features access
- Update quota limits
- Send cancellation confirmation email

#### 4. `invoice.payment_succeeded`
**When it happens**: Successful payment for subscription renewal
**What to do**:
- Extend subscription period
- Update billing information
- Send payment confirmation email
- Log successful payment

#### 5. `invoice.payment_failed`
**When it happens**: Payment fails (expired card, insufficient funds, etc.)
**What to do**:
- Send payment failure notification
- Attempt to retry payment (Stripe handles this)
- Prepare to downgrade if payment continues to fail
- Update user's account status

### Webhook Implementation in Your Code

Your webhook handler is located at `src/app/api/webhooks/stripe/route.ts`. Here's how it works:

```typescript
// Example webhook handler structure
export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');
  
  // Verify webhook signature
  const event = stripe.webhooks.constructEvent(
    body,
    signature!,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
  
  // Handle different event types
  switch (event.type) {
    case 'customer.subscription.created':
      await handleSubscriptionCreated(event.data.object);
      break;
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object);
      break;
    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event.data.object);
      break;
    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;
  }
  
  return new Response('Webhook processed', { status: 200 });
}
```

### Webhook Security Best Practices

1. **Always verify webhook signatures**
   - Stripe includes a signature with each webhook
   - Verify it matches your webhook secret
   - Prevents malicious requests

2. **Handle webhook failures gracefully**
   - Return 200 status even if processing fails
   - Log errors for debugging
   - Implement retry logic

3. **Process webhooks idempotently**
   - Same webhook can be sent multiple times
   - Check if you've already processed it
   - Avoid duplicate database updates

### Testing Webhooks Locally

1. **Install Stripe CLI**
   ```bash
   # Download from https://stripe.com/docs/stripe-cli
   stripe login
   ```

2. **Forward webhooks to local server**
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

3. **Test with sample events**
   ```bash
   stripe trigger customer.subscription.created
   stripe trigger invoice.payment_succeeded
   ```

### Monitoring Webhook Health

1. **Check webhook delivery status**
   - Go to Stripe Dashboard → Developers → Webhooks
   - View delivery status for each webhook
   - Check for failed deliveries

2. **Set up webhook monitoring**
   - Monitor response times
   - Track success/failure rates
   - Set up alerts for failures

3. **Log webhook events**
   - Log all incoming webhooks
   - Track processing times
   - Monitor for errors

### Common Webhook Issues & Solutions

#### Issue: Webhook Not Receiving Events
**Causes**:
- Incorrect endpoint URL
- Server not accessible
- Firewall blocking requests

**Solutions**:
- Verify endpoint URL is correct
- Check server is running and accessible
- Test with Stripe CLI

#### Issue: Webhook Signature Verification Fails
**Causes**:
- Wrong webhook secret
- Malformed request body
- Clock skew

**Solutions**:
- Verify webhook secret is correct
- Check request body parsing
- Ensure server clock is accurate

#### Issue: Webhook Processing Errors
**Causes**:
- Database connection issues
- Invalid event data
- Application errors

**Solutions**:
- Check database connectivity
- Validate event data structure
- Implement proper error handling

### Webhook Event Data Structure

Each webhook contains detailed information about the event:

```json
{
  "id": "evt_1234567890",
  "object": "event",
  "api_version": "2023-10-16",
  "created": 1640995200,
  "data": {
    "object": {
      "id": "sub_1234567890",
      "object": "subscription",
      "customer": "cus_1234567890",
      "status": "active",
      "current_period_start": 1640995200,
      "current_period_end": 1643587200,
      "plan": {
        "id": "price_1234567890",
        "amount": 1400,
        "currency": "usd"
      }
    }
  },
  "type": "customer.subscription.created"
}
```

### Webhook Retry Logic

Stripe automatically retries failed webhooks:
- **Retry schedule**: 1 minute, 5 minutes, 15 minutes, 1 hour, 3 hours, 6 hours, 12 hours, 24 hours
- **Maximum retries**: 3 attempts
- **Success criteria**: HTTP 200 response within 10 seconds

### Webhook Rate Limits

- **Default limit**: 100 webhooks per second per endpoint
- **Burst limit**: 200 webhooks per second
- **Monitor usage** in Stripe Dashboard

### Webhook Debugging Tips

1. **Use Stripe CLI for testing**
   ```bash
   stripe listen --print-secret
   ```

2. **Check webhook logs**
   - View in Stripe Dashboard
   - Check your application logs
   - Monitor response times

3. **Test with sample data**
   - Use Stripe's test events
   - Create test subscriptions
   - Verify database updates

### Webhook Best Practices Summary

✅ **Do's**:
- Always verify webhook signatures
- Return 200 status quickly
- Process webhooks asynchronously
- Log all webhook events
- Handle all event types
- Implement idempotency
- Monitor webhook health

❌ **Don'ts**:
- Don't ignore webhook failures
- Don't process webhooks synchronously
- Don't skip signature verification
- Don't return error status codes
- Don't assume webhook order
- Don't forget to handle retries

### Step 7: Configure Customer Portal

1. **Set up Customer Portal**
   - Go to **Settings** → **Customer Portal** in Stripe Dashboard
   - **Enable** the customer portal
   - Configure the settings:
     - **Allow customers to update payment methods**: ✅
     - **Allow customers to cancel subscriptions**: ✅
     - **Allow customers to pause subscriptions**: ❌ (optional)
     - **Allow customers to update billing information**: ✅

2. **Get Customer Portal URL**
   - Copy the **Customer Portal URL** from the settings
   - This will be used in your application

### Step 8: Test Your Setup

1. **Test in Test Mode First**
   - Switch to **Test Mode** in Stripe Dashboard
   - Use test card numbers:
     - Success: `4242 4242 4242 4242`
     - Decline: `4000 0000 0000 0002`
   - Test the complete flow

2. **Switch to Live Mode**
   - Once testing is complete, switch to **Live Mode**
   - Update your environment variables with live keys
   - Test with a real card (small amount)

### Step 9: Deploy Your Application

1. **Update Production Environment**
   - Set all environment variables in your hosting platform
   - Ensure `NODE_ENV=production`

2. **Verify Configuration**
   - Check that your app is using live Stripe keys
   - Test the subscription flow
   - Verify webhooks are working

## 🔧 Important Configuration Notes

### Environment Variables Checklist

Make sure these are set in production:

```env
# Required for Production
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Optional but Recommended
STRIPE_PRICE_ID=price_live_...
STRIPE_CUSTOMER_PORTAL_URL=https://billing.stripe.com/session/...
```

### Security Best Practices

1. **Never expose secret keys** in client-side code
2. **Use environment variables** for all sensitive data
3. **Verify webhook signatures** in production
4. **Handle webhook failures** gracefully
5. **Log all payment events** for debugging

### Monitoring & Analytics

1. **Set up Stripe Analytics**
   - Monitor conversion rates
   - Track subscription metrics
   - Set up alerts for failed payments

2. **Configure Notifications**
   - Set up email notifications for failed payments
   - Configure webhook failure alerts
   - Monitor customer portal usage

## 🚨 Common Issues & Solutions

### Issue 1: Webhook Not Receiving Events
**Solution**: 
- Check webhook URL is accessible
- Verify webhook secret is correct
- Check server logs for errors

### Issue 2: Payment Declined
**Solution**:
- Verify card details are correct
- Check if card supports recurring payments
- Ensure billing address matches

### Issue 3: Subscription Not Updating
**Solution**:
- Check webhook events are being processed
- Verify database updates are working
- Check application logs

## 📞 Support Resources

- **Stripe Documentation**: [stripe.com/docs](https://stripe.com/docs)
- **Stripe Support**: Available in your Stripe Dashboard
- **Webhook Testing**: Use Stripe CLI for local testing
- **API Reference**: [stripe.com/docs/api](https://stripe.com/docs/api)

## 🔄 Maintenance

### Regular Tasks
1. **Monitor webhook health** weekly
2. **Review failed payments** monthly
3. **Update Stripe SDK** quarterly
4. **Review pricing** annually

### Backup Procedures
1. **Export customer data** regularly
2. **Backup subscription data** monthly
3. **Test webhook endpoints** after deployments

## ✅ Final Checklist

Before going live, ensure:

- [ ] Live Stripe keys are configured
- [ ] Webhooks are set up and tested
- [ ] Customer portal is configured
- [ ] Environment variables are set
- [ ] Application is tested with real payments
- [ ] Error handling is implemented
- [ ] Logging is configured
- [ ] Support procedures are documented

## 🎉 Going Live

Once everything is tested and configured:

1. **Switch to live mode** in your application
2. **Monitor the first few transactions** closely
3. **Set up alerts** for any issues
4. **Have support ready** for customer questions

---

**Need Help?** If you encounter any issues during setup, refer to the Stripe documentation or contact your development team for assistance. 