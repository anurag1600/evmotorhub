'use client';

import { useState } from 'react';
import { ArrowRight, TrendingUp, PiggyBank, Leaf, Zap, Car, Fuel, Battery, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EVPetrolComparisonProps {
  className?: string;
}

const EV_DATA = {
  avgEvPrice: 120000,
  avgPetrolPrice: 100000,
  perKmEv: 1.5, // Rs per km for EV
  perKmPetrol: 4.5, // Rs per km for petrol (considering 40km/l and Rs 100/l petrol)
  maintenanceEv: 2000, // Annual in Rs
  maintenancePetrol: 8000, // Annual in Rs
  serviceIntervalEv: 6, // Months
  serviceIntervalPetrol: 3, // Months
};

export default function EVPetrolComparison({ className }: EVPetrolComparisonProps) {
  const [kilometers, setKilometers] = useState(15000);
  const [ownershipYears, setOwnershipYears] = useState(5);

  const calculateSavings = () => {
    const totalKm = kilometers * ownershipYears;
    const evRunningCost = totalKm * EV_DATA.perKmEv;
    const petrolRunningCost = totalKm * EV_DATA.perKmPetrol;
    const evMaintenance = EV_DATA.maintenanceEv * ownershipYears;
    const petrolMaintenance = EV_DATA.maintenancePetrol * ownershipYears;

    const evTotal = EV_DATA.avgEvPrice + evRunningCost + evMaintenance;
    const petrolTotal = EV_DATA.avgPetrolPrice + petrolRunningCost + petrolMaintenance;

    return {
      evTotal,
      petrolTotal,
      savings: petrolTotal - evTotal,
      runningSavings: petrolRunningCost - evRunningCost,
      maintenanceSavings: petrolMaintenance - evMaintenance,
    };
  };

  const savings = calculateSavings();
  const percentage = ((savings.savings / savings.petrolTotal) * 100).toFixed(0);

  const comparisonMetrics = [
    {
      label: 'Running Cost/km',
      ev: `Rs. ${EV_DATA.perKmEv}`,
      petrol: `Rs. ${EV_DATA.perKmPetrol}`,
      icon: Zap,
      saving: `${(((EV_DATA.perKmPetrol - EV_DATA.perKmEv) / EV_DATA.perKmPetrol) * 100).toFixed(0)}% lower`,
      color: 'blue',
    },
    {
      label: 'Annual Service',
      ev: 'Every 6 months',
      petrol: 'Every 3 months',
      icon: Calculator,
      saving: 'Half as often',
      color: 'teal',
    },
    {
      label: 'Maintenance/Year',
      ev: `Rs. ${EV_DATA.maintenanceEv.toLocaleString()}`,
      petrol: `Rs. ${EV_DATA.maintenancePetrol.toLocaleString()}`,
      icon: PiggyBank,
      saving: `Rs. ${(EV_DATA.maintenancePetrol - EV_DATA.maintenanceEv).toLocaleString()} saved`,
      color: 'green',
    },
  ];

  const benefits = [
    { icon: Leaf, text: 'Zero tailpipe emissions - cleaner air for your city' },
    { icon: TrendingUp, text: 'Lower total cost of ownership over 5 years' },
    { icon: Zap, text: 'Instant torque - fun, responsive acceleration' },
    { icon: PiggyBank, text: 'Government subsidies up to Rs. 22,500 available' },
  ];

  return (
    <section className={cn('py-14 md:py-20 bg-gradient-to-br from-[#0a2e14] via-[#0f4020] to-[#145a2c]', className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-3">
            <Leaf size={12} />
            Cost Comparison
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3">
            EV vs Petrol: The Real Savings
          </h2>
          <p className="text-green-200/80 text-sm sm:text-base max-w-2xl mx-auto">
            See how much you can save by switching to electric. Calculate your personalized savings based on your driving habits.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Calculator Card */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
              <Calculator size={18} className="text-green-300" />
              Savings Calculator
            </h3>

            {/* Sliders */}
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-green-200">Daily Kilometers</span>
                  <span className="text-white font-semibold">{kilometers.toLocaleString()} km/year</span>
                </div>
                <input
                  type="range"
                  min="5000"
                  max="30000"
                  step="1000"
                  value={kilometers}
                  onChange={(e) => setKilometers(Number(e.target.value))}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider-thumb"
                />
                <div className="flex justify-between text-xs text-green-300/60 mt-1">
                  <span>5,000 km/yr</span>
                  <span>30,000 km/yr</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-green-200">Ownership Period</span>
                  <span className="text-white font-semibold">{ownershipYears} years</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={ownershipYears}
                  onChange={(e) => setOwnershipYears(Number(e.target.value))}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider-thumb"
                />
                <div className="flex justify-between text-xs text-green-300/60 mt-1">
                  <span>1 year</span>
                  <span>10 years</span>
                </div>
              </div>
            </div>

            {/* Result */}
            <div className="mt-8 p-5 bg-gradient-to-br from-green-500/20 to-emerald-500/10 rounded-xl border border-green-400/30">
              <div className="text-center">
                <div className="text-xs text-green-300 uppercase tracking-wide mb-1">Your Total Savings</div>
                <div className="text-4xl sm:text-5xl font-extrabold text-white mb-2">
                  Rs. {savings.savings.toLocaleString()}
                </div>
                <div className="text-green-300 text-sm">
                  {percentage}% lower total cost than petrol vehicle
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-5 pt-5 border-t border-white/10">
                <div>
                  <div className="text-xs text-green-300/70 mb-1">EV Total Cost</div>
                  <div className="text-lg font-bold text-white">Rs. {savings.evTotal.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-green-300/70 mb-1">Petrol Total Cost</div>
                  <div className="text-lg font-bold text-red-300">Rs. {savings.petrolTotal.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Comparison Metrics */}
          <div className="space-y-4">
            {comparisonMetrics.map((metric) => (
              <div
                key={metric.label}
                className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-5 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                    metric.color === 'blue' && 'bg-blue-500/20 text-blue-300',
                    metric.color === 'teal' && 'bg-teal-500/20 text-teal-300',
                    metric.color === 'green' && 'bg-green-500/20 text-green-300',
                  )}>
                    <metric.icon size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-green-300/70 uppercase tracking-wide mb-1">{metric.label}</div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <Battery size={14} className="text-green-400" />
                        <span className="text-white font-semibold text-sm">{metric.ev}</span>
                      </div>
                      <ArrowRight size={14} className="text-gray-500" />
                      <div className="flex items-center gap-1.5">
                        <Fuel size={14} className="text-orange-400" />
                        <span className="text-gray-300 font-semibold text-sm">{metric.petrol}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-full">
                      {metric.saving}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Cost Breakdown Chart */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-5 mt-6">
              <div className="text-xs text-green-300/70 uppercase tracking-wide mb-4">5-Year Cost Breakdown</div>

              <div className="space-y-4">
                {/* EV Bar */}
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-white font-medium flex items-center gap-1.5">
                      <Battery size={14} className="text-green-400" /> Electric Vehicle
                    </span>
                    <span className="text-green-300">Rs. {savings.evTotal.toLocaleString()}</span>
                  </div>
                  <div className="h-4 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-500"
                      style={{ width: `${(savings.evTotal / savings.petrolTotal) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Petrol Bar */}
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-white font-medium flex items-center gap-1.5">
                      <Fuel size={14} className="text-orange-400" /> Petrol Vehicle
                    </span>
                    <span className="text-gray-400">Rs. {savings.petrolTotal.toLocaleString()}</span>
                  </div>
                  <div className="h-4 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-500"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {benefits.map((benefit, idx) => (
            <div
              key={idx}
              className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 hover:bg-white/10 transition-colors"
            >
              <benefit.icon size={20} className="text-green-400 mb-2" />
              <p className="text-sm text-white/90">{benefit.text}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-10 text-center">
          <a
            href="/vehicles"
            className="inline-flex items-center gap-2 bg-white text-[#145a2c] px-6 py-3 rounded-xl font-semibold text-sm hover:bg-green-50 transition-colors"
          >
            <Car size={16} />
            Explore Electric Vehicles
            <ArrowRight size={16} />
          </a>
        </div>
      </div>

      <style jsx>{`
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 18px;
          width: 18px;
          border-radius: 50%;
          background: #22c55e;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }
        input[type='range']::-moz-range-thumb {
          height: 18px;
          width: 18px;
          border-radius: 50%;
          background: #22c55e;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </section>
  );
}
