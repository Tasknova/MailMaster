-- Recreate default templates for MailMaster
-- Run this in your Supabase SQL Editor

-- First, clear any existing templates (optional)
-- DELETE FROM templates;

-- Insert two default templates
INSERT INTO templates (id, user_id, name, description, html_content, is_default, created_at, updated_at) VALUES 
(
  gen_random_uuid(),
  'e4c8c11a-009f-4c37-be8c-527efd56d6a6',
  'Welcome Email Template',
  'A professional welcome email template with company branding',
  '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to {{company_name}}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background-color: #2563eb; color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .greeting { font-size: 24px; color: #2563eb; margin-bottom: 20px; }
        .main-text { margin-bottom: 20px; }
        .features { background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .feature-item { margin: 10px 0; padding-left: 20px; position: relative; }
        .feature-item:before { content: "✓"; color: #2563eb; font-weight: bold; position: absolute; left: 0; }
        .cta-button { display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 14px; color: #64748b; }
        .company-info { margin-top: 15px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{company_name}}</h1>
            <p>Welcome to our community!</p>
        </div>
        
        <div class="content">
            <h1 class="greeting">Welcome, {{first_name}}! 👋</h1>
            
            <div class="main-text">
                <p>Thank you for choosing {{company_name}}. We''re thrilled to have you join our community of innovators and forward-thinkers.</p>
                
                <p>What You Can Expect:</p>
            </div>
            
            <div class="features">
                <div class="feature-item">Exclusive insights and industry updates</div>
                <div class="feature-item">Premium content and resources</div>
                <div class="feature-item">Early access to new features</div>
                <div class="feature-item">Personalized recommendations</div>
            </div>
            
            <p>We''re committed to providing you with the best experience possible. If you have any questions or need assistance, our support team is here to help.</p>
            
            <a href="#" class="cta-button">Get Started Now</a>
            
            <p><strong>Best regards,<br>The {{company_name}} Team</strong></p>
        </div>
        
        <div class="footer">
            <p>© 2024 {{company_name}}. All rights reserved.</p>
            <div class="company-info">
                <p>{{company_email}} | {{company_phone}}</p>
                <p>{{company_address}}</p>
            </div>
        </div>
    </div>
</body>
</html>',
  true,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'e4c8c11a-009f-4c37-be8c-527efd56d6a6',
  'Newsletter Template',
  'A clean newsletter template for regular updates and announcements',
  '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{company_name}} Newsletter</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 25px; text-align: center; }
        .content { padding: 30px; }
        .newsletter-title { font-size: 28px; margin-bottom: 10px; }
        .date { font-size: 14px; opacity: 0.9; margin-bottom: 20px; }
        .article { margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #e2e8f0; }
        .article:last-child { border-bottom: none; }
        .article-title { font-size: 20px; color: #2563eb; margin-bottom: 10px; }
        .article-excerpt { color: #64748b; margin-bottom: 15px; }
        .read-more { color: #2563eb; text-decoration: none; font-weight: bold; }
        .cta-section { background-color: #f1f5f9; padding: 25px; text-align: center; margin: 20px 0; border-radius: 8px; }
        .cta-button { display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; }
        .footer { background-color: #1e293b; color: white; padding: 25px; text-align: center; }
        .social-links { margin: 15px 0; }
        .social-links a { color: white; margin: 0 10px; text-decoration: none; }
        .unsubscribe { font-size: 12px; margin-top: 15px; }
        .unsubscribe a { color: #94a3b8; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="newsletter-title">{{company_name}} Newsletter</h1>
            <p class="date">{{current_date}}</p>
        </div>
        
        <div class="content">
            <h2>Hello {{first_name}},</h2>
            <p>Here''s what''s new this week at {{company_name}}:</p>
            
            <div class="article">
                <h3 class="article-title">Latest Industry Insights</h3>
                <p class="article-excerpt">Discover the latest trends and insights that are shaping our industry. Stay ahead of the curve with our expert analysis.</p>
                <a href="#" class="read-more">Read More →</a>
            </div>
            
            <div class="article">
                <h3 class="article-title">Product Updates</h3>
                <p class="article-excerpt">We''ve been working hard to improve our products and services. Check out the latest updates and new features.</p>
                <a href="#" class="read-more">Read More →</a>
            </div>
            
            <div class="article">
                <h3 class="article-title">Customer Success Stories</h3>
                <p class="article-excerpt">Learn how our customers are achieving their goals and transforming their businesses with our solutions.</p>
                <a href="#" class="read-more">Read More →</a>
            </div>
            
            <div class="cta-section">
                <h3>Ready to Get Started?</h3>
                <p>Join thousands of satisfied customers who trust {{company_name}}.</p>
                <a href="#" class="cta-button">Start Your Journey</a>
            </div>
        </div>
        
        <div class="footer">
            <div class="social-links">
                <a href="#">Facebook</a> |
                <a href="#">Twitter</a> |
                <a href="#">LinkedIn</a> |
                <a href="#">Instagram</a>
            </div>
            <p>{{company_email}} | {{company_phone}}</p>
            <p>{{company_address}}</p>
            <div class="unsubscribe">
                <p>You received this email because you signed up for {{company_name}} updates.</p>
                <p><a href="#">Unsubscribe</a> | <a href="#">Update Preferences</a></p>
            </div>
        </div>
    </div>
</body>
</html>',
  true,
  NOW(),
  NOW()
);

-- Verify the templates were created
SELECT id, name, description, is_default, created_at FROM templates ORDER BY created_at DESC; 