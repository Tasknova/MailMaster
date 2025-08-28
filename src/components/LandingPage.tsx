import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Mail, 
  Users, 
  BarChart3, 
  Zap, 
  Shield, 
  CheckCircle,
  ArrowRight,
  Star,
  Play
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();
  const features = [
    {
      icon: Mail,
      title: "Create Campaigns",
      description: "Create beautiful, responsive email campaigns with our simple drag-and-drop editor"
    },
    {
      icon: Users,
      title: "Manage Contacts",
      description: "Organize your contacts into lists and segments for targeted campaigns"
    },
    {
      icon: CheckCircle,
      title: "Simple and Easy to Use",
      description: "Everything you need to create and manage your email campaigns with ease."
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Marketing Manager",
      company: "TechCorp",
                    content: "MailMaster has transformed our email marketing. The analytics are incredible and our open rates have increased by 40%.",
      rating: 5
    },
    {
      name: "Mike Chen",
      role: "Founder",
      company: "StartupXYZ",
      content: "Easy to use, powerful features, and great support from Tasknova. Perfect for our growing business needs.",
      rating: 5
    },
    {
      name: "Emily Rodriguez",
      role: "Digital Marketing",
      company: "E-commerce Plus",
      content: "The automation features have saved us hours every week. Tasknova's platform is highly recommended!",
      rating: 5
    }
  ];



  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
               <img src="/logo2.png" alt="MailMaster Logo" className="h-8 w-auto" />
             </div>
                                  <div className="flex items-center gap-4">
                        <Button variant="outline" onClick={() => navigate('/dashboard')}>Sign In</Button>
                        <Button variant="hero" onClick={() => navigate('/dashboard')}>Get Started</Button>
                      </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container mx-auto px-4 text-center">
                     <div className="flex justify-center mb-8">
             <img src="/logo2.png" alt="MailMaster Logo" className="h-16 w-auto" />
           </div>
                     <h1 className="text-5xl md:text-6xl font-bold mb-6">
             <span className="bg-gradient-hero bg-clip-text text-transparent">MailMaster</span>
           </h1>
           <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
             Simple and easy-to-use email marketing platform. Create campaigns and manage contacts with ease.
           </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="hero" className="text-lg px-8 py-6" onClick={() => navigate('/dashboard')}>
              Start Free Trial
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6">
              <Play className="w-5 h-5 mr-2" />
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
                     <div className="text-center mb-16">
             <h2 className="text-4xl font-bold mb-4">Simple and Effective</h2>
             <p className="text-xl text-muted-foreground">
               Easy-to-use platform for all your email marketing needs
             </p>
           </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="relative">
                <CardContent className="pt-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4">"{testimonial.content}"</p>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role} at {testimonial.company}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-primary/80">
        <div className="container mx-auto px-4 text-center">
                     <h2 className="text-4xl font-bold text-white mb-4">
             Ready to get started?
           </h2>
           <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
             Start creating your email campaigns with Tasknova MailMaster today.
           </p>
          <Button size="lg" variant="secondary" className="text-lg px-8 py-6" onClick={() => navigate('/dashboard')}>
            Start Your Free Trial
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

             {/* Footer */}
       <footer className="border-t border-border py-12">
         <div className="container mx-auto px-4">
           <div className="text-center">
             <div className="flex justify-center space-x-6 mb-4">
               <a 
                 href="https://tasknova.io/privacy-policy/" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="text-muted-foreground hover:text-foreground transition-colors"
               >
                 Privacy Policy
               </a>
               <a 
                 href="https://tasknova.io/terms-and-conditions/" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="text-muted-foreground hover:text-foreground transition-colors"
               >
                 Terms and Conditions
               </a>
               <a 
                 href="https://tasknova.io/contact-us/" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="text-muted-foreground hover:text-foreground transition-colors"
               >
                 Contact Us
               </a>
             </div>
             <div className="border-t border-border pt-4 text-center text-muted-foreground">
               <p>&copy; 2024 Tasknova MailMaster. All rights reserved.</p>
             </div>
           </div>
         </div>
       </footer>
    </div>
  );
};

export default LandingPage; 