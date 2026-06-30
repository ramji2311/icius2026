/**
 * Mongo aggregate $addFields: verified revenue for one PaymentRegistration document.
 * Prefers sum of papers[].amountPaid when > 0; else verifiedAmount; else author-declared amount.
 */
export const paymentRegistrationEffectiveAmountStage = {
    $addFields: {
        effectiveRegAmount: {
            $let: {
                vars: {
                    paperSum: {
                        $reduce: {
                            input: { $ifNull: ['$papers', []] },
                            initialValue: 0,
                            in: { $add: ['$$value', { $ifNull: ['$$this.amountPaid', 0] }] }
                        }
                    }
                },
                in: {
                    $cond: [
                        { $gt: ['$$paperSum', 0] },
                        '$$paperSum',
                        { $ifNull: ['$verifiedAmount', '$amount'] }
                    ]
                }
            }
        }
    }
};
