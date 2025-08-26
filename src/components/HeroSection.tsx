import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Users, TrendingUp, Zap, Globe, CheckCircle } from "lucide-react";
import heroImage from "@/assets/hero-email.jpg";

const HeroSection = () => {
  const features = [
    "Connect Gmail directly",
    "Drag & drop email builder",
    "Advanced tracking & analytics", 
    "A/B testing campaigns",
    "Auto follow-up sequences",
    "Multiple Gmail accounts"
  ];

  const stats = [
    { label: "Emails Sent", value: "2M+", icon: Mail },
    { label: "Active Users", value: "10K+", icon: Users },
    { label: "Success Rate", value: "98%", icon: TrendingUp }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/10 to-primary/5">
      {/* Navigation */}
      <nav className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                MailMaster
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost">Features</Button>
              <Button variant="ghost">Pricing</Button>
              <Button variant="outline">Sign In</Button>
              <Button variant="hero">Get Started</Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Content */}
      <div className="container mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                Gmail-Powered
                <span className="bg-gradient-hero bg-clip-text text-transparent block">
                  Email Campaigns
                </span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Send professional email campaigns directly from Gmail. Track opens, clicks, and replies with advanced analytics. Perfect for small businesses and agencies, powered by Tasknova.
              </p>
            </div>

            {/* Features List */}
            <div className="grid grid-cols-2 gap-3">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2 animate-fade-in" 
                     style={{ animationDelay: `${index * 0.1}s` }}>
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{feature}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex gap-4">
              <Button variant="hero" size="xl" className="animate-pulse-glow">
                <Zap className="w-5 h-5" />
                Start Free Trial
              </Button>
              <Button variant="outline" size="xl">
                <Globe className="w-5 h-5" />
                View Demo
              </Button>
            </div>

            {/* Stats */}
            <div className="flex gap-8 pt-8 border-t border-border/50">
              {stats.map((stat, index) => (
                <div key={index} className="text-center animate-fade-in" 
                     style={{ animationDelay: `${0.5 + index * 0.1}s` }}>
                  <div className="flex items-center justify-center mb-2">
                    <stat.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Content - Hero Image */}
          <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <Card className="overflow-hidden shadow-elegant hover:shadow-glow transition-smooth">
              <CardContent className="p-0">
                <img 
                  src={heroImage} 
                  alt="Email Marketing Dashboard" 
                  className="w-full h-auto object-cover"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;