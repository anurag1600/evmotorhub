'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calculator, Zap, Info, ArrowRight, IndianRupee } from 'lucide-react';
import { calculateEMI, formatPrice } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { Vehicle } from '@/lib/types';

const bankRates = [
  { bank: 'SBI', rate: 8.75 },
  { bank: 'HDFC Bank', rate: 8.90 },
  { bank: 'ICICI Bank', rate: 9.00 },
  { bank: 'Axis Bank', rate: 9.25 },
  { bank: 'Kotak Bank', rate: 9.50 },
  { bank: 'Bank of Baroda', rate: 8.80 },
];

export default function EMICalculatorPage() {
  const [vehiclePrice, setVehiclePrice] = useState(1399900);
  const [downPayment, setDownPayment] = useState(279980);
  const [interestRate, setInterestRate] = useState(9.0);
  const [tenure, setTenure] = useState(60);
  const [vehiclePresets, setVehiclePresets] = useState<{ name: string; price: number }[]>([]);

  useEffect(() => {
    supabase
      .from('vehicles')
      .select('name, price_min')
      .eq('status', 'published')
      .eq('is_upcoming', false)
      .order('is_featured', { ascending: false })
      .limit(8)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setVehiclePresets(data.map((v: any) => ({ name: v.name, price: v.price_min })));
        }
      });
  }, []);

  const loanAmount = vehiclePrice - downPayment;
  const emi = calculateEMI(loanAmount, interestRate, tenure);
  const totalPayment = emi * tenure;
  const totalInterest = totalPayment - loanAmount;
  const downPaymentPercent = Math.round((downPayment / vehiclePrice) * 100);

  useEffect(() => {
    setDownPayment((prev) => (prev > vehiclePrice ? Math.round(vehiclePrice * 0.2) : prev));
  }, [vehiclePrice]);

  const principalPercent = totalPayment > 0 ? Math.round((loanAmount / totalPayment) * 100) : 0;

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0a2e14] to-[#145a2c] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-3 mb-2">
            <Calculator size={24} className="text-green-300" />
            <h1 className="text-2xl sm:text-3xl font-bold">EV EMI Calculator</h1>
          </div>
          <p className="text-green-200 text-sm">Calculate your monthly payments for any electric vehicle in India</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Vehicle Price Presets */}
        {vehiclePresets.length > 0 && (
          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-700 mb-3">Quick Select a Vehicle</p>
            <div className="flex flex-wrap gap-2">
              {vehiclePresets.map((p) => (
                <button
                  key={p.name}
                  onClick={() => setVehiclePrice(p.price)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors min-h-[40px] ${
                    vehiclePrice === p.price
                      ? 'bg-[#145a2c] text-white shadow-sm'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-green-300 hover:text-[#145a2c]'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-5 md:gap-6">
          {/* Calculator Inputs */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6 space-y-5">
            <h2 className="text-lg font-bold text-gray-900">Loan Parameters</h2>

            {/* Vehicle Price */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-gray-700">Vehicle Price</label>
                <div className="flex items-center gap-1 bg-green-50 text-[#145a2c] font-bold px-3 py-1.5 rounded-lg text-sm">
                  <IndianRupee size={12} />
                  {vehiclePrice.toLocaleString('en-IN')}
                </div>
              </div>
              <input
                type="range"
                min="50000"
                max="5000000"
                step="10000"
                value={vehiclePrice}
                onChange={(e) => setVehiclePrice(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer accent-[#145a2c]"
                style={{ background: `linear-gradient(to right, #145a2c ${((vehiclePrice - 50000) / 4950000) * 100}%, #e5e7eb ${((vehiclePrice - 50000) / 4950000) * 100}%)` }}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>50K</span>
                <span>50L</span>
              </div>
            </div>

            {/* Down Payment */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-gray-700">Down Payment ({downPaymentPercent}%)</label>
                <div className="flex items-center gap-1 bg-blue-50 text-blue-700 font-bold px-3 py-1.5 rounded-lg text-sm">
                  <IndianRupee size={12} />
                  {downPayment.toLocaleString('en-IN')}
                </div>
              </div>
              <input
                type="range"
                min="0"
                max={vehiclePrice}
                step="5000"
                value={downPayment}
                onChange={(e) => setDownPayment(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer accent-blue-600"
                style={{ background: `linear-gradient(to right, #1d4ed8 ${vehiclePrice > 0 ? (downPayment / vehiclePrice) * 100 : 0}%, #e5e7eb ${vehiclePrice > 0 ? (downPayment / vehiclePrice) * 100 : 0}%)` }}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>₹0 (0%)</span>
                <span>{(vehiclePrice / 100000).toFixed(1)}L (100%)</span>
              </div>
            </div>

            {/* Interest Rate */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-gray-700">Interest Rate</label>
                <div className="bg-amber-50 text-amber-700 font-bold px-3 py-1.5 rounded-lg text-sm">
                  {interestRate.toFixed(2)}% p.a.
                </div>
              </div>
              <input
                type="range"
                min="7"
                max="18"
                step="0.25"
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer accent-amber-600"
                style={{ background: `linear-gradient(to right, #d97706 ${((interestRate - 7) / 11) * 100}%, #e5e7eb ${((interestRate - 7) / 11) * 100}%)` }}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>7%</span>
                <span>18%</span>
              </div>
            </div>

            {/* Loan Tenure */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-gray-700">Loan Tenure</label>
                <div className="bg-rose-50 text-rose-700 font-bold px-3 py-1.5 rounded-lg text-sm">
                  {tenure} mo ({(tenure / 12).toFixed(1)} yr)
                </div>
              </div>
              <input
                type="range"
                min="12"
                max="84"
                step="6"
                value={tenure}
                onChange={(e) => setTenure(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer accent-rose-600"
                style={{ background: `linear-gradient(to right, #e11d48 ${((tenure - 12) / 72) * 100}%, #e5e7eb ${((tenure - 12) / 72) * 100}%)` }}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>1 yr</span>
                <span>7 yr</span>
              </div>
              <div className="flex gap-2 mt-3">
                {[24, 36, 48, 60, 72].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTenure(t)}
                    className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors min-h-[36px] ${
                      tenure === t ? 'bg-[#145a2c] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {t / 12} yr
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-5">
            {/* EMI Result */}
            <div className="bg-gradient-to-br from-[#0f4020] to-[#145a2c] rounded-2xl p-5 md:p-6 text-white">
              <div className="text-green-200 text-sm font-medium mb-1">Monthly EMI</div>
              <div className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-1">
                ₹{emi.toLocaleString('en-IN')}
              </div>
              <div className="text-green-300 text-sm">/month for {tenure} months</div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="bg-white/10 rounded-xl p-3">
                  <div className="text-xs text-green-300 mb-1">Loan Amount</div>
                  <div className="font-bold text-sm">₹{loanAmount.toLocaleString('en-IN')}</div>
                </div>
                <div className="bg-white/10 rounded-xl p-3">
                  <div className="text-xs text-green-300 mb-1">Down Payment</div>
                  <div className="font-bold text-sm">₹{downPayment.toLocaleString('en-IN')}</div>
                </div>
                <div className="bg-white/10 rounded-xl p-3">
                  <div className="text-xs text-green-300 mb-1">Total Interest</div>
                  <div className="font-bold text-sm text-amber-300">₹{totalInterest.toLocaleString('en-IN')}</div>
                </div>
                <div className="bg-white/10 rounded-xl p-3">
                  <div className="text-xs text-green-300 mb-1">Total Payment</div>
                  <div className="font-bold text-sm">₹{totalPayment.toLocaleString('en-IN')}</div>
                </div>
              </div>

              {/* Principal vs Interest bar */}
              <div className="mt-5">
                <div className="flex justify-between text-xs text-green-300 mb-1.5">
                  <span>Principal: {principalPercent}%</span>
                  <span>Interest: {100 - principalPercent}%</span>
                </div>
                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-400 rounded-full transition-all duration-300"
                    style={{ width: `${principalPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Bank Rates */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-sm font-bold text-gray-700">Current EV Loan Rates</h3>
                <Info size={14} className="text-gray-400" />
              </div>
              <div className="space-y-1">
                {bankRates.map((b) => (
                  <div key={b.bank} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-700 font-medium">{b.bank}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-[#145a2c]">{b.rate}%</span>
                      <button
                        onClick={() => setInterestRate(b.rate)}
                        className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-lg hover:bg-green-100 transition-colors min-h-[32px]"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-3">* Rates are indicative. Actual rates may vary based on credit profile.</p>
            </div>

            {/* CTA */}
            <div className="bg-green-50 rounded-2xl border border-green-100 p-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-[#145a2c]">Ready to buy an EV?</div>
                <div className="text-xs text-gray-600 mt-0.5">Browse our full EV listing</div>
              </div>
              <Link
                href="/vehicles"
                className="flex items-center gap-1.5 bg-[#145a2c] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#0f4020] transition-colors whitespace-nowrap"
              >
                Explore EVs <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
