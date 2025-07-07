import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiX, FiCreditCard, FiDollarSign, FiLock, FiCheck, FiCalendar, FiUser, FiShield } = FiIcons;

const PaymentModal = ({ isOpen, onClose, onPaymentComplete, subscription }) => {
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [processing, setProcessing] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const handlePayment = async (data) => {
    setProcessing(true);
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const paymentDetails = {
        paymentMethod,
        ...data,
        processedAt: new Date().toISOString()
      };
      
      onPaymentComplete(paymentMethod, paymentDetails);
    } catch (error) {
      console.error('Payment error:', error);
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen || !subscription) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div 
        className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Complete Payment</h2>
              <p className="text-sm text-gray-600 mt-1">Secure payment processing</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <SafeIcon icon={FiX} className="w-6 h-6" />
            </button>
          </div>

          {/* Subscription Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Subscription Summary</h3>
            <div className="space-y-1 text-sm text-blue-800">
              <div className="flex justify-between">
                <span>Package:</span>
                <span className="font-medium">
                  {subscription.package?.name || 'Custom Package'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Duration:</span>
                <span>{subscription.duration_months} months</span>
              </div>
              <div className="flex justify-between">
                <span>Total Amount:</span>
                <span className="font-bold">€{subscription.price.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Payment Method
            </label>
            <div className="space-y-2">
              <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  value="stripe" 
                  checked={paymentMethod === 'stripe'} 
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <SafeIcon icon={FiCreditCard} className="w-5 h-5 text-blue-600 ml-3 mr-2" />
                <span className="text-sm font-medium text-gray-900">Credit/Debit Card</span>
              </label>
              
              <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  value="paypal" 
                  checked={paymentMethod === 'paypal'} 
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <SafeIcon icon={FiDollarSign} className="w-5 h-5 text-blue-600 ml-3 mr-2" />
                <span className="text-sm font-medium text-gray-900">PayPal</span>
              </label>
              
              <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  value="bank_transfer" 
                  checked={paymentMethod === 'bank_transfer'} 
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <SafeIcon icon={FiShield} className="w-5 h-5 text-blue-600 ml-3 mr-2" />
                <span className="text-sm font-medium text-gray-900">Bank Transfer</span>
              </label>
            </div>
          </div>

          {/* Payment Form */}
          <form onSubmit={handleSubmit(handlePayment)} className="space-y-4">
            {paymentMethod === 'stripe' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Card Number *
                  </label>
                  <input 
                    type="text" 
                    {...register('cardNumber', { 
                      required: 'Card number is required',
                      pattern: {
                        value: /^[0-9\s]{13,19}$/,
                        message: 'Invalid card number'
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="1234 5678 9012 3456"
                  />
                  {errors.cardNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.cardNumber.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expiry Date *
                    </label>
                    <input 
                      type="text" 
                      {...register('expiryDate', { 
                        required: 'Expiry date is required',
                        pattern: {
                          value: /^(0[1-9]|1[0-2])\/([0-9]{2})$/,
                          message: 'Format: MM/YY'
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="MM/YY"
                    />
                    {errors.expiryDate && (
                      <p className="mt-1 text-sm text-red-600">{errors.expiryDate.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CVC *
                    </label>
                    <input 
                      type="text" 
                      {...register('cvc', { 
                        required: 'CVC is required',
                        pattern: {
                          value: /^[0-9]{3,4}$/,
                          message: 'Invalid CVC'
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="123"
                    />
                    {errors.cvc && (
                      <p className="mt-1 text-sm text-red-600">{errors.cvc.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cardholder Name *
                  </label>
                  <input 
                    type="text" 
                    {...register('cardholderName', { 
                      required: 'Cardholder name is required'
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="John Doe"
                  />
                  {errors.cardholderName && (
                    <p className="mt-1 text-sm text-red-600">{errors.cardholderName.message}</p>
                  )}
                </div>
              </>
            )}

            {paymentMethod === 'paypal' && (
              <div className="text-center py-8">
                <SafeIcon icon={FiDollarSign} className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  You will be redirected to PayPal to complete your payment.
                </p>
              </div>
            )}

            {paymentMethod === 'bank_transfer' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-yellow-900 mb-2">Bank Transfer Instructions</h4>
                <div className="text-sm text-yellow-800 space-y-1">
                  <p><strong>Account Name:</strong> Soccer Team Finance Ltd</p>
                  <p><strong>IBAN:</strong> DE89 3704 0044 0532 0130 00</p>
                  <p><strong>BIC:</strong> COBADEFFXXX</p>
                  <p><strong>Reference:</strong> SUB-{subscription.id}</p>
                  <p className="mt-2 text-xs">
                    Please include the reference number in your transfer. Your subscription will be activated once payment is received.
                  </p>
                </div>
              </div>
            )}

            {/* Security Notice */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center">
                <SafeIcon icon={FiLock} className="w-4 h-4 text-green-600 mr-2" />
                <p className="text-sm text-green-800">
                  Your payment information is encrypted and secure
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <button 
                type="button" 
                onClick={onClose}
                disabled={processing}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={processing}
                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <SafeIcon icon={FiCheck} className="w-4 h-4 mr-2" />
                    Pay €{subscription.price.toFixed(2)}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentModal;