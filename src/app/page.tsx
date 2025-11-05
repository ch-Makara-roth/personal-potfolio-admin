import { AppLayout } from '@/components/layout';

export default function Home() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">
            Welcome to your CONSULT hiring analytics dashboard
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-card">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Applications
            </h3>
            <p className="text-3xl font-bold text-purple-600">1,234</p>
            <p className="text-sm text-gray-500 mt-1">+12% from last month</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-card">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Interviews
            </h3>
            <p className="text-3xl font-bold text-blue-600">89</p>
            <p className="text-sm text-gray-500 mt-1">Scheduled this week</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-card">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Hired</h3>
            <p className="text-3xl font-bold text-cyan-500">23</p>
            <p className="text-sm text-gray-500 mt-1">This month</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activity
          </h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <p className="text-gray-700">
                New application received for Senior Developer position
              </p>
              <span className="text-sm text-gray-500 ml-auto">2 hours ago</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <p className="text-gray-700">
                Interview scheduled with Sarah Johnson
              </p>
              <span className="text-sm text-gray-500 ml-auto">4 hours ago</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
              <p className="text-gray-700">Offer accepted by Michael Chen</p>
              <span className="text-sm text-gray-500 ml-auto">1 day ago</span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
