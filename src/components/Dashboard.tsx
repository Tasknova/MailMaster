import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Mail, 
  Users, 
  TrendingUp, 
  Clock,
  Plus,
  MoreHorizontal,
  Eye,
  MousePointer,
  Reply
} from "lucide-react";

interface DashboardProps {
  onNavigate: (view: 'campaigns' | 'contacts') => void;
}

const Dashboard = ({ onNavigate }: DashboardProps) => {
  const statsCards = [
    {
      title: "Total Sent",
      value: "12,847",
      change: "+2.5%",
      changeType: "positive" as const,
      icon: Mail,
      description: "Emails sent this month"
    },
    {
      title: "Open Rate",
      value: "24.8%",
      change: "+1.2%",
      changeType: "positive" as const,
      icon: Eye,
      description: "Average open rate"
    },
    {
      title: "Click Rate",
      value: "3.2%",
      change: "-0.3%",
      changeType: "negative" as const,
      icon: MousePointer,
      description: "Average click rate"
    },
    {
      title: "Reply Rate",
      value: "1.8%",
      change: "+0.5%",
      changeType: "positive" as const,
      icon: Reply,
      description: "Average reply rate"
    }
  ];

  const recentCampaigns = [
    {
      id: 1,
      name: "Product Launch Newsletter",
      status: "sent",
      sent: 2847,
      opened: 658,
      clicked: 89,
      date: "2 hours ago"
    },
    {
      id: 2,
      name: "Welcome Series - Email 1",
      status: "scheduled",
      sent: 0,
      opened: 0,
      clicked: 0,
      date: "Tomorrow 9:00 AM"
    },
    {
      id: 3,
      name: "Monthly Newsletter",
      status: "draft",
      sent: 0,
      opened: 0,
      clicked: 0,
      date: "3 days ago"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return "bg-green-100 text-green-800";
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your email campaign overview.</p>
        </div>
        <Button variant="hero" size="lg" onClick={() => onNavigate('campaigns')}>
          <Plus className="w-4 h-4" />
          New Campaign
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <Card key={index} className="hover:shadow-card transition-smooth animate-fade-in" 
                style={{ animationDelay: `${index * 0.1}s` }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp className={`h-3 w-3 ${
                  stat.changeType === 'positive' ? 'text-green-500' : 'text-red-500'
                }`} />
                <span className={stat.changeType === 'positive' ? 'text-green-500' : 'text-red-500'}>
                  {stat.change}
                </span>
                <span>from last month</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Campaigns */}
      <Card className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Recent Campaigns</CardTitle>
              <CardDescription>Your latest email campaigns and their performance</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentCampaigns.map((campaign) => (
              <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-smooth">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium">{campaign.name}</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                        {campaign.status}
                      </span>
                      <Clock className="w-3 h-3" />
                      <span>{campaign.date}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-sm font-medium">{campaign.sent.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Sent</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium">{campaign.opened.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Opened</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium">{campaign.clicked.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Clicked</div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;