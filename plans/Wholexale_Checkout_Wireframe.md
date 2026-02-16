# Wholexale Checkout Wireframe (Mobile First)

## 1. Checkout Goals
1. Fast B2B conversion with minimum friction.
2. Full financial clarity before order placement.
3. Support COD, wallet, and credit-aware payment logic.
4. Keep legal data capture (GST invoice details) mandatory where needed.

## 2. Checkout Stepper
`Cart -> Address -> Delivery -> Payment -> Review -> Success`

## 3. Mobile Wireframe

## Step 0: Cart

```
+------------------------------------------------+
| <- Cart                               2 items  |
+------------------------------------------------+
| [img] Embroidery Kurti Lot-402                 |
|       Variant: Blue, M                         |
|       Qty [-] 2 [+]          Price: INR 900    |
|                                                |
| [img] Cotton Set Lot-120                        |
|       Variant: Black, L                        |
|       Qty [-] 1 [+]          Price: INR 450    |
+------------------------------------------------+
| Coupon Code [___________] [Apply]              |
+------------------------------------------------+
| Subtotal                             INR 1350   |
| Discount                             INR  100   |
| Shipping                             INR   40   |
| COD Fee                              INR   20   |
| Total                                INR 1310   |
+------------------------------------------------+
| [ Continue to Address ]                        |
+------------------------------------------------+
```

## Step 1: Address

```
+------------------------------------------------+
| <- Select Delivery Address                      |
+------------------------------------------------+
| (o) Primary Store                              |
|     12 MG Road, Bangalore 560001               |
|     +91 90000 00000                            |
|     [Edit]                                     |
|                                                |
| ( ) Warehouse                                  |
|     Plot 22 Ring Road, Surat 395007            |
|     +91 91111 11111                            |
|     [Edit]                                     |
+------------------------------------------------+
| + Add New Address                              |
+------------------------------------------------+
| GST Invoice Needed? [x] Yes [ ] No             |
| GSTIN: [____________________]                  |
| Company Name: [________________]               |
+------------------------------------------------+
| [ Continue to Delivery ]                       |
+------------------------------------------------+
```

## Step 2: Delivery

```
+------------------------------------------------+
| <- Delivery Options                             |
+------------------------------------------------+
| Serviceability: 560001 (Available)             |
| Estimated Delivery: Tue, 2-4 days              |
+------------------------------------------------+
| (o) Standard Delivery - INR 40                 |
|     ETA 2-4 days                               |
| ( ) Express Delivery - INR 90                  |
|     ETA 1-2 days                               |
+------------------------------------------------+
| Preferred Slot (optional)                      |
| [ Tomorrow 10AM-1PM v ]                        |
+------------------------------------------------+
| Packaging                                       |
| [x] Secure B2B packing                         |
| [ ] Eco packing                                |
+------------------------------------------------+
| [ Continue to Payment ]                        |
+------------------------------------------------+
```

## Step 3: Payment

```
+------------------------------------------------+
| <- Payment Method                               |
+------------------------------------------------+
| Wallet Balance: INR 300                         |
| Credit Available (Vendor): INR 25,000          |
+------------------------------------------------+
| ( ) UPI                                         |
| ( ) Card / Netbanking                           |
| (o) Cash on Delivery                            |
| ( ) Pay via Vendor Credit                       |
+------------------------------------------------+
| If Pay via Vendor Credit:                       |
|    Current Utilized: INR 12,000                |
|    This Order: INR 1,310                        |
|    Remaining After Order: INR 11,690           |
+------------------------------------------------+
| Split Payment                                   |
| Use Wallet: [x] INR 300                         |
| Pay Remaining via: COD                          |
+------------------------------------------------+
| [ Continue to Review ]                         |
+------------------------------------------------+
```

## Step 4: Review and Place Order

```
+------------------------------------------------+
| <- Review Order                                 |
+------------------------------------------------+
| Items Summary (2) [View]                        |
| Address: Primary Store [Change]                 |
| Delivery: Standard (2-4 days) [Change]          |
| Payment: Wallet + COD [Change]                  |
+------------------------------------------------+
| Price Details                                   |
| Subtotal                             INR 1350   |
| Discount                             INR  100   |
| Shipping                             INR   40   |
| COD Fee                              INR   20   |
| Wallet Used                          INR  300-  |
| Payable Now                          INR 1010   |
+------------------------------------------------+
| Terms                                            |
| [x] I agree to return and cancellation policy   |
| [x] I confirm invoice details are correct        |
+------------------------------------------------+
| [ Place Order ]                                  |
+------------------------------------------------+
```

## Step 5: Success

```
+------------------------------------------------+
|                Order Placed                     |
|                #WHX-2026-001293                |
+------------------------------------------------+
| Payment: COD + Wallet                           |
| ETA: Tue, 2-4 days                              |
+------------------------------------------------+
| [ Track Order ]   [ Download Invoice ]          |
| [ Continue Shopping ]                           |
+------------------------------------------------+
```

## 4. Validation Rules (Must Have)
1. Block progression if address is missing.
2. Block GST invoice flow when GSTIN is invalid but invoice requested.
3. If COD not allowed for cart value/pincode/category, hide COD and show reason.
4. If vendor credit insufficient, disable credit payment and show limit warning.
5. Freeze final amount for 10 minutes on review step to avoid mid-checkout price drift.

## 5. API Contract Required for Checkout
1. `POST /api/checkout/validate-cart`
2. `POST /api/checkout/address/validate`
3. `POST /api/checkout/delivery/options`
4. `POST /api/checkout/payment/options`
5. `POST /api/checkout/review`
6. `POST /api/checkout/place-order`

## 6. Admin and Vendor Hooks
1. Vendor receives order notification instantly with payment mode and risk tags.
2. Admin sees checkout failures by reason code:
   `invalid_address`, `payment_declined`, `credit_limit_exceeded`, `serviceability_failed`.
3. Finance ledger entry created at place-order event, not delayed.

## 7. Future Extensions
1. One-click reorder from previous successful order.
2. Saved payment profiles with tokenized cards.
3. Smart delivery recommendations by pincode performance.
4. Checkout A/B experiments for conversion optimization.

