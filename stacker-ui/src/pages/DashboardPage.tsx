import { useQuery } from '@apollo/client/react';
import { BookOpen, PenLine, MessageSquare, Users } from 'lucide-react';
import { GET_DASHBOARD_STATS } from '@/graphql/queries';

interface DashboardStats {
  bookCount: number;
  authorCount: number;
  reviewCount: number;
  userCount: number;
}

export default function DashboardPage() {
  const { data, loading } = useQuery<{ dashboardStats: DashboardStats }>(GET_DASHBOARD_STATS);
  const stats = data?.dashboardStats;

  const cards = [
    { label: 'Books', value: stats?.bookCount ?? 0, icon: BookOpen, color: 'text-blue-600 bg-blue-50' },
    { label: 'Authors', value: stats?.authorCount ?? 0, icon: PenLine, color: 'text-green-600 bg-green-50' },
    { label: 'Reviews', value: stats?.reviewCount ?? 0, icon: MessageSquare, color: 'text-amber-600 bg-amber-50' },
    { label: 'Users', value: stats?.userCount ?? 0, icon: Users, color: 'text-purple-600 bg-purple-50' },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border bg-white p-6 animate-pulse">
              <div className="h-10 w-10 rounded-lg bg-gray-100 mb-3" />
              <div className="h-4 w-16 bg-gray-100 rounded mb-2" />
              <div className="h-8 w-12 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card) => (
            <div key={card.label} className="rounded-xl border bg-white p-6 shadow-sm">
              <div className={`h-10 w-10 rounded-lg ${card.color} flex items-center justify-center mb-3`}>
                <card.icon className="h-5 w-5" />
              </div>
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <p className="text-3xl font-bold">{card.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
