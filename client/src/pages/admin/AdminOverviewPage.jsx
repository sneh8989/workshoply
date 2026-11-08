import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin.api';
import { formatPrice } from '../../utils/formatters';
import {
  CalendarDays,
  Ticket,
  IndianRupee,
  TrendingUp,
  Clock
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export const AdminOverviewPage = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const res = await adminApi.getAnalytics();
        setData(res.data);
      } catch (err) {
        console.error('Failed to load admin overview:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOverview();
  }, []);

  if (isLoading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-8 h-8 border-4 border-primary border-t-secondary rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-muted">Aggregating database analytics...</p>
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const trends = data?.bookingTrends || [];
  const workshops = data?.workshopPerformance || [];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-secondary">
          Executive Dashboard
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
          Platform Performance & Revenue
        </h1>
        <p className="text-xs text-muted mt-1">
          Authoritative real-time metrics derived strictly from captured transactions and database reservations.
        </p>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Captured Revenue */}
        <div className="card-surface p-5 space-y-2 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-bold uppercase tracking-wider">Verified Revenue</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-primary">
            {formatPrice(metrics.totalRevenuePaise || 0)}
          </div>
          <p className="text-[11px] text-muted">
            Excludes pending, failed, or unverified orders.
          </p>
        </div>

        {/* Confirmed Bookings */}
        <div className="card-surface p-5 space-y-2 border-l-4 border-l-secondary">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-bold uppercase tracking-wider">Confirmed Bookings</span>
            <div className="p-2 bg-orange-50 text-secondary rounded-lg">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-primary">
            {metrics.confirmedBookings || 0}
          </div>
          <p className="text-[11px] text-muted">
            Total registrations: {metrics.totalBookings || 0}
          </p>
        </div>

        {/* Active Workshops */}
        <div className="card-surface p-5 space-y-2 border-l-4 border-l-primary">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-bold uppercase tracking-wider">Published Workshops</span>
            <div className="p-2 bg-stone-100 text-primary rounded-lg">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-primary">
            {metrics.publishedWorkshops || 0}
          </div>
          <p className="text-[11px] text-muted">
            Upcoming sessions: {metrics.upcomingWorkshops || 0}
          </p>
        </div>

        {/* Pending Orders */}
        <div className="card-surface p-5 space-y-2 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Orders</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-primary">
            {metrics.pendingPaymentsCount || 0}
          </div>
          <p className="text-[11px] text-muted">
            Temporary holds expiring in 10 mins.
          </p>
        </div>
      </div>

      {/* Booking Trends Chart */}
      <div className="card-surface p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-main">Confirmed Booking Activity</h3>
            <p className="text-xs text-muted">Recent volume of successfully verified attendee bookings.</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-secondary font-semibold">
            <TrendingUp className="w-4 h-4" />
            <span>30-Day Activity</span>
          </div>
        </div>

        <div className="h-64 w-full pt-4">
          {trends.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-muted">
              No booking transactions recorded in this window yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val, name) => [
                    name === 'count' ? `${val} bookings` : formatPrice(val),
                    name === 'count' ? 'Registrations' : 'Revenue'
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#F97316"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#F97316' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Workshop Seat Utilization Table */}
      <div className="card-surface p-6 space-y-4">
        <h3 className="text-base font-bold text-main">Workshop Seat Utilization & Demand</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-muted uppercase tracking-wider font-bold">
                <th className="pb-3">Workshop Title</th>
                <th className="pb-3">Category</th>
                <th className="pb-3">Capacity</th>
                <th className="pb-3">Booked Seats</th>
                <th className="pb-3">Seat Utilization</th>
                <th className="pb-3">Captured Tuition</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {workshops.map((w) => (
                <tr key={w.id} className="hover:bg-stone-50">
                  <td className="py-3 font-bold text-main max-w-xs truncate pr-4">
                    {w.title}
                  </td>
                  <td className="py-3 text-muted">{w.category}</td>
                  <td className="py-3 font-semibold text-main">{w.capacity}</td>
                  <td className="py-3 font-bold text-secondary">{w.bookedSeats}</td>
                  <td className="py-3 min-w-[140px]">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-stone-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            w.utilizationRate >= 80 ? 'bg-secondary' : 'bg-primary'
                          }`}
                          style={{ width: `${Math.min(100, w.utilizationRate)}%` }}
                        ></div>
                      </div>
                      <span className="font-semibold text-[11px] text-muted">
                        {w.utilizationRate}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 font-extrabold text-primary">
                    {formatPrice(w.totalRevenueInPaise)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
