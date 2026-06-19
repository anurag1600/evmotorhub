'use client';

import { useState } from 'react';
import { ArrowRight, TrendingUp, PiggyBank, Leaf, Zap, Car, Fuel, Battery, Calculator, DollarSign, Calendar } from 'lucide-react';
import Link from 'next/link';

const EV_DATA = {
  avgEvPrice: 120000,
  avgPetrolPrice: 100000,
  perKmEv: 1.5, // Rs per km for EV (approx 15-20 Rs/unit, 10-12 km/kWh)
  perKmPetrol: 4.5, // Rs per km for petrol (approx Rs 100/l, 22-25 km/l average)
  maintenanceEv: 2000, // Annual in Rs (less moving parts, no oil changes)
  maintenancePetrol: 8000, // Annual in Rs (oil changes, filters, more frequent service)
};

export default function EVPetrolComparison() {
  const [kilometers, setKilometers] = useState(10000); // Default 10,000 km/year
  const [ownershipYears, setOwnershipYears] = useState(5);

  // Calculate all values
  const totalKm = kilometers * ownershipYears;
  const evRunningCost = totalKm * EV_DATA.perKmEv;
  const petrolRunningCost = totalKm * EV_DATA.perKmPetrol;
  const evMaintenance = EV_DATA.maintenanceEv * ownershipYears;
  const petrolMaintenance = EV_DATA.maintenancePetrol * ownershipYears;

  const evTotal = EV_DATA.avgEvPrice + evRunningCost + evMaintenance;
  const petrolTotal = EV_DATA.avgPetrolPrice + petrolRunningCost + petrolMaintenance;
  const totalSavings = petrolTotal - evTotal;
  const monthlySavings = totalSavings / (ownershipYears * 12);
  const annualSavings = totalSavings / ownershipYears;

  // CO2 calculation: petrol vehicle emits ~2.31 kg CO2 per liter
  // Average petrol bike gives ~45 km/l, cars ~15 km/l - using 25 km/l average
  const petrolLiters = totalKm / 25;
  const co2Kg = petrolLiters * 2.31; // kg of CO2
  const co2Tonnes = (co2Kg / 1000).toFixed(1); // convert to tonnes

  // Trees needed to offset (1 tree absorbs ~21 kg CO2/year)
  const treesEquiv = Math.round(co2Kg / 21);

  const formatPrice = (val: number): string => {
    if (val >= 100000) return `Rs. ${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `Rs. ${(val / 1000).toFixed(0)}K`;
    return `Rs. ${val.toLocaleString()}`;
  };

  const dailyKm = Math.round(kilometers / 365);

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            <TrendingUp size={12} />
            Cost Comparison
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
            EV vs Petrol: The Real Savings
          </h2>
          <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto">
            Calculate your personalized savings. Enter your daily commute and see how much you&apos;ll save going electric.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Left: Calculator */}
          <div className="bg-gradient-to-br from-gray-50 to-green-50/30 rounded-2xl p-6 sm:p-8 border border-gray-100">
            <div className="flex items-center gap-2 mb-6">
              <Calculator size={18} className="text-[#145a2c]" />
              <span className="font-semibold text-gray-900">Savings Calculator</span>
            </div>

            {/* Daily Distance Slider */}
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Daily Commute</span>
                <span className="font-semibold text-gray-900">{dailyKm} km/day</span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                step="5"
                value={dailyKm}
                onChange={(e) => setKilometers(Number(e.target.value) * 365)}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#145a2c]"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0 km</span>
                <span>80 km</span>
              </div>
            </div>

            {/* Ownership Slider */}
            <div className="mb-8">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Ownership Period</span>
                <span className="font-semibold text-gray-900">{ownershipYears} years</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={ownershipYears}
                onChange={(e) => setOwnershipYears(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#145a2c]"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>1 year</span>
                <span>10 years</span>
              </div>
            </div>

            {/* Total Savings Card */}
            <div className="bg-[#145a2c] rounded-xl p-6 text-white text-center shadow-lg">
              <div className="text-sm text-green-200 mb-1">Your {ownershipYears}-Year Total Savings</div>
              <div className="text-4xl sm:text-5xl font-extrabold mb-2">{formatPrice(totalSavings)}</div>
              <div className="text-green-200 text-sm">
                That&apos;s {formatPrice(monthlySavings)}/month in your pocket!
              </div>
            </div>
          </div>

          {/* Right: Comparison Cards */}
          <div className="space-y-4">
            {/* Monthly Running Cost */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <Calendar size={18} className="text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Monthly Running Cost</div>
                    <div className="font-bold text-gray-900">
                      {formatPrice((EV_DATA.perKmPetrol - EV_DATA.perKmEv) * kilometers / 12)} saved
                    </div>
                  </div>
                </div>
                <div className="text-right text-xs space-y-1">
                  <div className="text-green-600 font-semibold bg-green-50 px-2 py-1 rounded">
                    EV: {formatPrice(EV_DATA.perKmEv * kilometers / 12)}
                  </div>
                  <div className="text-gray-400">
                    Petrol: {formatPrice(EV_DATA.perKmPetrol * kilometers / 12)}
                  </div>
                </div>
              </div>
            </div>

            {/* Annual Savings */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                    <DollarSign size={18} className="text-teal-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Annual Savings</div>
                    <div className="font-bold text-gray-900">{formatPrice(annualSavings)}</div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">Every year</div>
              </div>
            </div>

            {/* Total Ownership Savings */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <PiggyBank size={18} className="text-amber-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">{ownershipYears}-Year Total</div>
                    <div className="font-bold text-gray-900">{formatPrice(totalSavings)}</div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">Over {ownershipYears} years</div>
              </div>
            </div>

            {/* Cost per Kilometer */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-sm text-gray-500 mb-3">Cost per Kilometer</div>
              <div className="flex items-center gap-4">
                <div className="flex-1 text-center p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Battery size={14} className="text-green-600" />
                    <span className="text-xs font-semibold text-green-600">EV Charging</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">Rs. {EV_DATA.perKmEv}</div>
                </div>
                <div className="text-gray-300 text-xl">vs</div>
                <div className="flex-1 text-center p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Fuel size={14} className="text-orange-600" />
                    <span className="text-xs font-semibold text-orange-600">Petrol</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">Rs. {EV_DATA.perKmPetrol}</div>
                </div>
              </div>
            </div>

            {/* CO2 Saved */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100 p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Leaf size={22} className="text-green-600" />
                </div>
                <div>
                  <div className="text-sm text-green-700 font-medium">Environmental Impact</div>
                  <div className="text-xl font-bold text-green-800">
                    {co2Tonnes} tonnes CO2 prevented
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    Equivalent to planting {treesEquiv} trees
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-10 text-center">
          <Link
            href="/vehicles"
            className="inline-flex items-center gap-2 bg-[#145a2c] text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-[#0f4020] transition-colors shadow-lg hover:shadow-xl"
          >
            <Car size={16} />
            Explore Electric Vehicles
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
