'use client';

import { useState } from 'react';
import { ArrowRight, TrendingUp, PiggyBank, Leaf, Zap, Car, Fuel, Battery, Calculator, DollarSign, Calendar, ChartBar as BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const EV_DATA = {
  avgEvPrice: 120000,
  avgPetrolPrice: 100000,
  perKmEv: 1.5, // Rs per km for EV
  perKmPetrol: 4.5, // Rs per km for petrol
  maintenanceEv: 2000, // Annual in Rs
  maintenancePetrol: 8000, // Annual in Rs
};

export default function EVPetrolComparison() {
  const [kilometers, setKilometers] = useState(15000);
  const [ownershipYears, setOwnershipYears] = useState(5);

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

  // CO2 calculation (approx 2.3kg CO2 per liter petrol, 40km/l average)
  const petrolLiters = totalKm / 40;
  const co2Saved = (petrolLiters * 2.3 / 1000).toFixed(1); // tonnes

  const formatPrice = (val: number) => {
    if (val >= 100000) return `Rs. ${(val / 100000).toFixed(1)}L`;
    return `Rs. ${val.toLocaleString()}`;
  };

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
            See how much you can save by switching to electric. Calculate your personalized savings based on your driving habits.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left: Simple Calculator */}
          <div className="bg-gray-50 rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-6">
              <Calculator size={18} className="text-[#145a2c]" />
              <span className="font-semibold text-gray-900">Savings Calculator</span>
            </div>

            {/* Sliders */}
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Daily Distance</span>
                  <span className="font-semibold text-gray-900">{Math.round(kilometers / 365)} km/day</span>
                </div>
                <input
                  type="range"
                  min="5000"
                  max="30000"
                  step="1000"
                  value={kilometers}
                  onChange={(e) => setKilometers(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#145a2c]"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>5,000 km/yr</span>
                  <span>30,000 km/yr</span>
                </div>
              </div>

              <div>
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
            </div>

            {/* Big Savings Number */}
            <div className="mt-8 p-6 bg-[#145a2c] rounded-xl text-white text-center">
              <div className="text-sm text-green-200 mb-1">Your {ownershipYears}-Year Savings</div>
              <div className="text-4xl sm:text-5xl font-extrabold mb-2">
                {formatPrice(totalSavings)}
              </div>
              <div className="text-green-200 text-sm">
                {formatPrice(monthlySavings)}/month saved vs petrol vehicle
              </div>
            </div>
          </div>

          {/* Right: Simple Comparison Cards */}
          <div className="space-y-4">
            {/* Monthly Cost */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <Calendar size={18} className="text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Monthly Running Cost</div>
                    <div className="font-bold text-gray-900">{formatPrice((EV_DATA.perKmPetrol - EV_DATA.perKmEv) * kilometers / 12)} saved</div>
                  </div>
                </div>
                <div className="text-right text-xs">
                  <div className="text-green-600 font-semibold">EV: {formatPrice(EV_DATA.perKmEv * kilometers / 12)}</div>
                  <div className="text-gray-400">Petrol: {formatPrice(EV_DATA.perKmPetrol * kilometers / 12)}</div>
                </div>
              </div>
            </div>

            {/* Annual Savings */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
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
                <div className="text-xs text-gray-500">Per year on average</div>
              </div>
            </div>

            {/* 5-Year Savings */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <PiggyBank size={18} className="text-amber-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">{ownershipYears}-Year Total Savings</div>
                    <div className="font-bold text-gray-900">{formatPrice(totalSavings)}</div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">Over vehicle lifetime</div>
              </div>
            </div>

            {/* CO2 Saved */}
            <div className="bg-green-50 rounded-xl border border-green-100 p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Leaf size={18} className="text-green-600" />
                </div>
                <div>
                  <div className="text-sm text-green-700">CO2 Emissions Prevented</div>
                  <div className="font-bold text-green-800">{co2Saved} tonnes over {ownershipYears} years</div>
                </div>
              </div>
            </div>

            {/* Fuel vs Charging */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <div className="text-sm text-gray-500 mb-3">Cost per Kilometer</div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Battery size={14} className="text-green-600" />
                    <span className="text-sm font-semibold text-green-600">EV Charging</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">Rs. {EV_DATA.perKmEv}</div>
                </div>
                <div className="text-gray-300 text-2xl">vs</div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Fuel size={14} className="text-orange-500" />
                    <span className="text-sm font-semibold text-orange-500">Petrol</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">Rs. {EV_DATA.perKmPetrol}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-10 text-center">
          <Link
            href="/vehicles"
            className="inline-flex items-center gap-2 bg-[#145a2c] text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-[#0f4020] transition-colors"
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
