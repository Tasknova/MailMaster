import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  User, 
  Building,
  ArrowRight,
  Loader2,
  AlertCircle,
  Home
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

const Login = () => {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [activeTab, setActiveTab] = useState('signin');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Check for error in URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    if (error) {
      setAuthError(decodeURIComponent(error));
      // Clear the error from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Sign in form
  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  });

  // Sign up form
  const [signUpData, setSignUpData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    company: ''
  });

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);

    try {
      const { error } = await signIn(signInData.email, signInData.password);
      
      if (error) {
        setAuthError(error.message || "Invalid email or password");
        toast({
          title: "Sign in failed",
          description: error.message || "Invalid email or password",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });
      }
    } catch (error) {
      const errorMessage = "An unexpected error occurred. Please try again.";
      setAuthError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);

    // Validate passwords match
    if (signUpData.password !== signUpData.confirmPassword) {
      setAuthError("Passwords don't match");
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Validate password strength
    if (signUpData.password.length < 6) {
      setAuthError("Password must be at least 6 characters long");
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      const { error } = await signUp(signUpData.email, signUpData.password, {
        first_name: signUpData.firstName,
        last_name: signUpData.lastName,
        company: signUpData.company
      });
      
      if (error) {
        setAuthError(error.message || "Failed to create account");
        toast({
          title: "Sign up failed",
          description: error.message || "Failed to create account",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Account created!",
          description: "Please check your email to verify your account.",
        });
        // Reset form
        setSignUpData({
          email: '',
          password: '',
          confirmPassword: '',
          firstName: '',
          lastName: '',
          company: ''
        });
        setActiveTab('signin');
      }
    } catch (error) {
      const errorMessage = "An unexpected error occurred. Please try again.";
      setAuthError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setAuthError(null);
    
    try {
      const { error } = await signInWithGoogle();
      
      if (error) {
        setAuthError(error.message || 'Google sign-in failed');
      }
    } catch (error) {
      setAuthError('An unexpected error occurred during Google sign-in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-sky-100/20 to-blue-100/20"></div>
      <div className="absolute top-10 left-10 w-32 h-32 bg-sky-200/30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 right-10 w-40 h-40 bg-blue-200/30 rounded-full blur-3xl"></div>
      
      {/* Home button */}
      <div className="absolute top-6 left-6">
        <Button 
          variant="ghost" 
          size="sm" 
          className="bg-white/80 backdrop-blur-sm hover:bg-white/90 shadow-lg"
          onClick={() => window.location.href = '/'}
        >
          <Home className="w-4 h-4 mr-2" />
          Home
        </Button>
      </div>
      
      <div className="w-full max-w-md relative z-10">
                 {/* Logo and Title */}
         <div className="text-center mb-8">
           <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-sky-500 to-sky-600 rounded-2xl mb-6 shadow-lg">
             <Mail className="w-10 h-10 text-white" />
           </div>
           <h1 className="text-4xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-sky-600 to-sky-800 bg-clip-text text-transparent">MailMaster</h1>
           <p className="text-gray-600 text-lg">Professional Email Marketing Platform</p>
         </div>

                 {/* Auth Card */}
         <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
           <CardHeader className="text-center pb-6">
             <CardTitle className="text-2xl font-bold text-gray-900">Welcome to MailMaster</CardTitle>
             <p className="text-base text-muted-foreground">
               Manage your email campaigns with ease
             </p>
           </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Error Alert */}
            {authError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{authError}</AlertDescription>
              </Alert>
            )}

                         {/* Google Sign In */}
             <div className="space-y-4">
               <Button 
                 variant="outline" 
                 className="w-full h-12 border-2 border-gray-200 hover:border-sky-300 hover:bg-sky-50 transition-all duration-200" 
                 onClick={handleGoogleSignIn}
                 disabled={loading}
               >
                 {loading ? (
                   <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                 ) : (
                   <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                     <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                     <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                     <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                     <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                   </svg>
                 )}
                 <span className="font-semibold">Continue with Google</span>
               </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>
            </div>

            {/* Auth Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-4">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                             <Input
                         id="signin-email"
                         type="email"
                         placeholder="Enter your email"
                         value={signInData.email}
                         onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                         className="pl-10 h-12 border-2 border-gray-200 focus:border-sky-400 focus:ring-sky-400/20 transition-all duration-200"
                         required
                       />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                             <Input
                         id="signin-password"
                         type={showPassword ? "text" : "password"}
                         placeholder="Enter your password"
                         value={signInData.password}
                         onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                         className="pl-10 pr-10 h-12 border-2 border-gray-200 focus:border-sky-400 focus:ring-sky-400/20 transition-all duration-200"
                         required
                       />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                                     <Button type="submit" className="w-full h-12 bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200" disabled={loading}>
                     {loading ? (
                       <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                     ) : (
                       <ArrowRight className="w-5 h-5 mr-3" />
                     )}
                     Sign In
                   </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-firstname">First Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-firstname"
                          type="text"
                          placeholder="First name"
                          value={signUpData.firstName}
                          onChange={(e) => setSignUpData({ ...signUpData, firstName: e.target.value })}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-lastname">Last Name</Label>
                      <Input
                        id="signup-lastname"
                        type="text"
                        placeholder="Last name"
                        value={signUpData.lastName}
                        onChange={(e) => setSignUpData({ ...signUpData, lastName: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-company">Company (Optional)</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-company"
                        type="text"
                        placeholder="Your company name"
                        value={signUpData.company}
                        onChange={(e) => setSignUpData({ ...signUpData, company: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="Enter your email"
                        value={signUpData.email}
                        onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        value={signUpData.password}
                        onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                        className="pl-10 pr-10"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Must be at least 6 characters long
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={signUpData.confirmPassword}
                        onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                        className="pl-10 pr-10"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                                     <Button type="submit" className="w-full h-12 bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200" disabled={loading}>
                     {loading ? (
                       <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                     ) : (
                       <User className="w-5 h-5 mr-3" />
                     )}
                     Create Account
                   </Button>
                </form>
              </TabsContent>
            </Tabs>

                         {/* Features */}
             <div className="pt-8 border-t border-gray-200">
               <div className="text-center space-y-4">
                 <p className="text-sm font-medium text-gray-700">What you'll get with MailMaster:</p>
                 <div className="flex flex-wrap justify-center gap-3">
                   <Badge variant="secondary" className="text-xs bg-sky-100 text-sky-800 hover:bg-sky-200 border-sky-200">Email Campaigns</Badge>
                   <Badge variant="secondary" className="text-xs bg-sky-100 text-sky-800 hover:bg-sky-200 border-sky-200">Contact Management</Badge>
                   <Badge variant="secondary" className="text-xs bg-sky-100 text-sky-800 hover:bg-sky-200 border-sky-200">Template Editor</Badge>
                   <Badge variant="secondary" className="text-xs bg-sky-100 text-sky-800 hover:bg-sky-200 border-sky-200">Analytics</Badge>
                   <Badge variant="secondary" className="text-xs bg-sky-100 text-sky-800 hover:bg-sky-200 border-sky-200">Gmail Integration</Badge>
                 </div>
               </div>
             </div>
          </CardContent>
        </Card>

                 {/* Footer */}
         <div className="text-center mt-8">
           <p className="text-xs text-muted-foreground">
             By signing up, you agree to our Terms of Service and Privacy Policy
           </p>
         </div>
       </div>
     </div>
  );
};

export default Login; 