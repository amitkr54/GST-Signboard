'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { checkPaymentStatus } from '@/app/actions';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function PaymentStatusPage() {
    return (
        <Suspense fallback={<div className="min-h-screen" />}> 
            <PaymentStatusContent />
        </Suspense>
    );
}

function PaymentStatusContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verifyPayment = async () => {
            const merchantTransactionId = searchParams.get('id');
            if (!merchantTransactionId) {
                setStatus('failed');
                setMessage('Invalid transaction ID');
                return;
            }

            try {
                const result = await checkPaymentStatus(merchantTransactionId);
                if (result.success) {
                    setStatus('success');
                    // Get stored design data to redirect to success page properly if needed
                    // For now, we just show success here or redirect to main success page
                    setTimeout(() => {
                        router.push('/success');
                    }, 2000);
                } else {
                    setStatus('failed');
                    setMessage(result.message || 'Payment verification failed');
                }
            } catch (error) {
                setStatus('failed');
                setMessage('An error occurred while verifying payment');
            }
        };

        verifyPayment();
    }, [searchParams, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
                {status === 'loading' && (
                    <div className="flex flex-col items-center">
                        <Loader2 className="w-16 h-16 text-purple-600 animate-spin mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800">Verifying Payment...</h2>
                        <p className="text-gray-600 mt-2">Please wait while we confirm your transaction.</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center">
                        <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800">Payment Successful!</h2>
                        <p className="text-gray-600 mt-2">Your order has been placed successfully.</p>
                        <p className="text-sm text-gray-500 mt-4">Redirecting to order confirmation...</p>
                    </div>
                )}

                {status === 'failed' && (
                    <div className="flex flex-col items-center">
                        <XCircle className="w-16 h-16 text-red-500 mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800">Payment Failed</h2>
                        <p className="text-red-600 mt-2">{message}</p>
                        <button
                            onClick={() => router.push('/design')}
                            className="mt-6 px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
