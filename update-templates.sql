-- Update existing templates with professional designs
-- Run this in your Supabase SQL Editor

-- First, let's check if the templates table exists and has data
SELECT * FROM public.templates;

-- Update the Welcome Email template
UPDATE public.templates 
SET 
  name = 'Professional Welcome Email',
  description = 'A modern, professional welcome email template with company branding',
  html_content = '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{subject}}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: ''Segoe UI'', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f8f9fa; }
        .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
        .logo { font-size: 28px; font-weight: 700; margin-bottom: 10px; }
        .tagline { font-size: 16px; opacity: 0.9; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 24px; color: #2c3e50; margin-bottom: 20px; }
        .main-text { font-size: 16px; color: #555; margin-bottom: 25px; }
        .features { background-color: #f8f9fa; padding: 25px; border-radius: 8px; margin: 25px 0; }
        .features h3 { color: #2c3e50; margin-bottom: 15px; }
        .features ul { list-style: none; }
        .features li { padding: 8px 0; color: #555; position: relative; padding-left: 25px; }
        .features li:before { content: "✓"; color: #27ae60; font-weight: bold; position: absolute; left: 0; }
        .cta-section { text-align: center; margin: 30px 0; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: 600; font-size: 16px; transition: transform 0.3s ease; }
        .cta-button:hover { transform: translateY(-2px); }
        .footer { background-color: #2c3e50; color: white; padding: 30px; text-align: center; }
        .contact-info { margin-bottom: 20px; }
        .contact-info p { margin: 5px 0; font-size: 14px; }
        .social-links { margin: 20px 0; }
        .social-links a { color: white; text-decoration: none; margin: 0 10px; font-size: 14px; }
        .legal-links { border-top: 1px solid #34495e; padding-top: 20px; }
        .legal-links a { color: #bdc3c7; text-decoration: none; margin: 0 10px; font-size: 12px; }
        @media only screen and (max-width: 600px) {
            .email-container { margin: 0; }
            .header, .content, .footer { padding: 20px; }
            .logo { font-size: 24px; }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">{{company_name}}</div>
            <div class="tagline">Welcome to the Future</div>
        </div>
        
        <div class="content">
            <h1 class="greeting">Welcome, {{first_name}}! 👋</h1>
            
            <p class="main-text">
                Thank you for choosing {{company_name}}. We''re thrilled to have you join our community of innovators and forward-thinkers.
            </p>
            
            <div class="features">
                <h3>What You Can Expect:</h3>
                <ul>
                    <li>Exclusive insights and industry updates</li>
                    <li>Premium content and resources</li>
                    <li>Early access to new features</li>
                    <li>Personalized recommendations</li>
                </ul>
            </div>
            
            <p class="main-text">
                We''re committed to providing you with the best experience possible. If you have any questions or need assistance, our support team is here to help.
            </p>
            
            <div class="cta-section">
                <a href="https://example.com/dashboard" class="cta-button">Get Started Now</a>
            </div>
            
            <p class="main-text" style="text-align: center; margin-top: 30px;">
                Best regards,<br>
                <strong>The {{company_name}} Team</strong>
            </p>
        </div>
        
        <div class="footer">
            <div class="contact-info">
                <p><strong>{{company_name}}</strong></p>
                <p>{{company_address}}</p>
                <p>📧 {{company_email}} | 📞 {{company_phone}}</p>
            </div>
            
            <div class="social-links">
                <a href="#">LinkedIn</a> | <a href="#">Twitter</a> | <a href="#">Facebook</a>
            </div>
            
            <div class="legal-links">
                <a href="{{unsubscribe_url}}">Unsubscribe</a> | 
                <a href="{{preferences_url}}">Update Preferences</a> | 
                <a href="#">Privacy Policy</a>
            </div>
        </div>
    </div>
</body>
</html>'
WHERE name = 'Welcome Email';

-- Update Newsletter template
UPDATE public.templates 
SET 
  name = 'Modern Newsletter Template',
  description = 'A contemporary newsletter template with multiple sections and modern design',
  html_content = '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{subject}}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: ''Segoe UI'', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f8f9fa; }
        .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 40px 30px; text-align: center; }
        .logo { font-size: 28px; font-weight: 700; margin-bottom: 10px; }
        .issue-info { font-size: 16px; opacity: 0.9; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 24px; color: #2c3e50; margin-bottom: 20px; }
        .intro-text { font-size: 16px; color: #555; margin-bottom: 30px; }
        .section { margin-bottom: 35px; }
        .section-title { color: #11998e; font-size: 20px; margin-bottom: 15px; border-bottom: 2px solid #11998e; padding-bottom: 8px; }
        .highlight-box { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 25px; border-radius: 10px; margin: 20px 0; }
        .highlight-box h4 { margin-bottom: 10px; font-size: 18px; }
        .tips-list { background-color: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #11998e; }
        .tips-list ul { list-style: none; }
        .tips-list li { padding: 8px 0; color: #555; position: relative; padding-left: 25px; }
        .tips-list li:before { content: "💡"; position: absolute; left: 0; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: 600; font-size: 16px; transition: transform 0.3s ease; }
        .cta-button:hover { transform: translateY(-2px); }
        .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 25px 0; }
        .stat-box { background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .stat-number { font-size: 24px; font-weight: bold; color: #11998e; }
        .stat-label { font-size: 14px; color: #666; margin-top: 5px; }
        .footer { background-color: #2c3e50; color: white; padding: 30px; text-align: center; }
        .contact-info { margin-bottom: 20px; }
        .contact-info p { margin: 5px 0; font-size: 14px; }
        .social-links { margin: 20px 0; }
        .social-links a { color: white; text-decoration: none; margin: 0 10px; font-size: 14px; }
        .legal-links { border-top: 1px solid #34495e; padding-top: 20px; }
        .legal-links a { color: #bdc3c7; text-decoration: none; margin: 0 10px; font-size: 12px; }
        @media only screen and (max-width: 600px) {
            .email-container { margin: 0; }
            .header, .content, .footer { padding: 20px; }
            .logo { font-size: 24px; }
            .stats-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">{{company_name}}</div>
            <div class="issue-info">Monthly Newsletter • {{subject}}</div>
        </div>
        
        <div class="content">
            <h1 class="greeting">Hello {{first_name}}! 🌟</h1>
            
            <p class="intro-text">
                Welcome to our monthly newsletter! We''ve curated the most exciting updates, insights, and opportunities just for you.
            </p>
            
            <div class="section">
                <h2 class="section-title">📈 This Month''s Highlights</h2>
                <div class="stats-grid">
                    <div class="stat-box">
                        <div class="stat-number">15%</div>
                        <div class="stat-label">Growth Increase</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-number">2.5K</div>
                        <div class="stat-label">New Members</div>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2 class="section-title">🔥 Featured Story</h2>
                <div class="highlight-box">
                    <h4>Breaking News: Major Platform Update</h4>
                    <p>We''ve completely redesigned our platform to provide you with an even better experience. New features include advanced analytics, improved collaboration tools, and enhanced security measures.</p>
                    <a href="https://example.com/update" class="cta-button" style="background: white; color: #f5576c;">Learn More</a>
                </div>
            </div>
            
            <div class="section">
                <h2 class="section-title">💡 Pro Tips</h2>
                <div class="tips-list">
                    <ul>
                        <li>Optimize your workflow with our new automation features</li>
                        <li>Join our upcoming webinar on "Advanced Strategies"</li>
                        <li>Connect with other members in our community forum</li>
                        <li>Download our latest resource guide for free</li>
                    </ul>
                </div>
            </div>
            
            <div class="section">
                <h2 class="section-title">🎯 Upcoming Events</h2>
                <p style="margin-bottom: 20px;">Don''t miss these exciting opportunities to learn and grow with our community:</p>
                <ul style="list-style: none; margin-bottom: 20px;">
                    <li style="padding: 10px 0; border-bottom: 1px solid #eee;">📅 <strong>Webinar:</strong> "Future of Digital Marketing" - Next Tuesday</li>
                    <li style="padding: 10px 0; border-bottom: 1px solid #eee;">🎪 <strong>Conference:</strong> Annual Tech Summit - March 15-17</li>
                    <li style="padding: 10px 0;">🏆 <strong>Contest:</strong> Innovation Challenge - Submit by March 30</li>
                </ul>
                <div style="text-align: center;">
                    <a href="https://example.com/events" class="cta-button">View All Events</a>
                </div>
            </div>
            
            <p style="text-align: center; margin-top: 40px; color: #666;">
                Thank you for being part of our amazing community!<br>
                <strong>The {{company_name}} Team</strong>
            </p>
        </div>
        
        <div class="footer">
            <div class="contact-info">
                <p><strong>{{company_name}}</strong></p>
                <p>{{company_address}}</p>
                <p>📧 {{company_email}} | 📞 {{company_phone}}</p>
            </div>
            
            <div class="social-links">
                <a href="#">LinkedIn</a> | <a href="#">Twitter</a> | <a href="#">Facebook</a> | <a href="#">Instagram</a>
            </div>
            
            <div class="legal-links">
                <a href="{{unsubscribe_url}}">Unsubscribe</a> | 
                <a href="{{preferences_url}}">Update Preferences</a> | 
                <a href="#">Privacy Policy</a> | 
                <a href="#">Terms of Service</a>
            </div>
        </div>
    </div>
</body>
</html>'
WHERE name = 'Newsletter Template';

-- Also update the RLS policies to allow reading default templates
DROP POLICY IF EXISTS "Users can manage their own templates" ON public.templates;
DROP POLICY IF EXISTS "Users can read default templates" ON public.templates;

CREATE POLICY "Users can manage their own templates" 
ON public.templates 
FOR ALL 
USING (auth.uid() = user_id OR is_default = true)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read default templates" 
ON public.templates 
FOR SELECT 
USING (is_default = true);

-- Verify the updates
SELECT id, name, description, is_default FROM public.templates ORDER BY created_at; 