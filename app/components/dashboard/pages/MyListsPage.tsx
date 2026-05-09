'use client';

import React from 'react';

export function MyListsPage() {
  return (
    <div className="bg-black min-h-full p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-white text-3xl font-bold mb-2">
        My Lists
      </h1>
          <p className="text-green-400 text-lg font-bold mb-4">
            ✅ NEW DASHBOARD LOADED SUCCESSFULLY!
          </p>
          <p className="text-gray-400">
            Manage your saved creator lists and campaigns
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gray-900 rounded-xl p-6">
            <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <h3 className="text-white font-semibold mb-2">Saved Lists</h3>
            <p className="text-gray-400 text-sm">
              Access your saved creator lists and favorites
            </p>
          </div>

          <div className="bg-gray-900 rounded-xl p-6">
            <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-white font-semibold mb-2">Active Campaigns</h3>
            <p className="text-gray-400 text-sm">
              Track your ongoing influencer marketing campaigns
            </p>
          </div>

          <div className="bg-gray-900 rounded-xl p-6">
            <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-white font-semibold mb-2">Recent Activity</h3>
            <p className="text-gray-400 text-sm">
              View your recent interactions and list updates
            </p>
          </div>
        </div>

        {/* Status Message */}
        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">
            My Lists page functionality coming soon
          </p>
        </div>
      </div>
    </div>
  );
}