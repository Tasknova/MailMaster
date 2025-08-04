-- Add additional default templates that are common for all users
-- These templates will be available to all users without being linked to any specific user_id
-- Note: Some default templates already exist from the initial migration

-- Check if templates already exist to avoid duplicates
INSERT INTO public.templates (user_id, name, description, html_content, is_default, created_at, updated_at)
SELECT 
  '00000000-0000-0000-0000-000000000000',
  'Simple Welcome Email',
  'A clean, simple welcome email template with basic styling',
  '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{subject}}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; margin-bottom: 20px; }
        .content { padding: 20px; }
        .button { display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; margin-top: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Welcome to {{company_name}}!</h1>
    </div>
    
    <div class="content">
        <h2>Hello {{first_name}}!</h2>
        
        <p>Thank you for joining our community. We''re excited to have you on board!</p>
        
        <p>Here''s what you can expect from us:</p>
        <ul>
            <li>Regular updates and insights</li>
            <li>Exclusive content and resources</li>
            <li>Special offers and promotions</li>
        </ul>
        
        <a href="https://example.com/get-started" class="button">Get Started</a>
        
        <p>If you have any questions, feel free to reach out to us at {{company_email}}.</p>
        
        <p>Best regards,<br>The {{company_name}} Team</p>
    </div>
    
    <div class="footer">
        <p>{{company_name}} | {{company_address}}</p>
        <p><a href="{{unsubscribe_url}}">Unsubscribe</a> | <a href="{{preferences_url}}">Update Preferences</a></p>
    </div>
</body>
</html>',
  true,
  now(),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.templates WHERE name = 'Simple Welcome Email' AND is_default = true
);
(
  '00000000-0000-0000-0000-000000000000', -- System user ID for default templates
  'Simple Welcome Email',
  'A clean, simple welcome email template with basic styling',
  '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{subject}}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; margin-bottom: 20px; }
        .content { padding: 20px; }
        .button { display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; margin-top: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Welcome to {{company_name}}!</h1>
    </div>
    
    <div class="content">
        <h2>Hello {{first_name}}!</h2>
        
        <p>Thank you for joining our community. We''re excited to have you on board!</p>
        
        <p>Here''s what you can expect from us:</p>
        <ul>
            <li>Regular updates and insights</li>
            <li>Exclusive content and resources</li>
            <li>Special offers and promotions</li>
        </ul>
        
        <a href="https://example.com/get-started" class="button">Get Started</a>
        
        <p>If you have any questions, feel free to reach out to us at {{company_email}}.</p>
        
        <p>Best regards,<br>The {{company_name}} Team</p>
    </div>
    
    <div class="footer">
        <p>{{company_name}} | {{company_address}}</p>
        <p><a href="{{unsubscribe_url}}">Unsubscribe</a> | <a href="{{preferences_url}}">Update Preferences</a></p>
    </div>
</body>
</html>',
  true,
  now(),
  now()
);

-- Add Newsletter Template
INSERT INTO public.templates (user_id, name, description, html_content, is_default, created_at, updated_at)
SELECT 
  '00000000-0000-0000-0000-000000000000',
  'Newsletter Template',
  'A professional newsletter template with multiple sections',
  '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{subject}}</title>
    <style>
        body { font-family: ''Segoe UI'', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px; margin-bottom: 20px; }
        .section { margin-bottom: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px; }
        .section h3 { color: #667eea; margin-bottom: 15px; }
        .highlight { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; }
        .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        .footer { background-color: #2c3e50; color: white; padding: 20px; text-align: center; border-radius: 8px; margin-top: 20px; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{company_name}} Newsletter</h1>
        <p>Stay updated with the latest news and insights</p>
    </div>
    
    <div class="content">
        <h2>Hello {{first_name}}!</h2>
        
        <div class="section">
            <h3>📰 Latest News</h3>
            <p>Here''s what''s happening in our industry and what you need to know.</p>
            <div class="highlight">
                <strong>Breaking:</strong> New developments that could impact your business.
            </div>
        </div>
        
        <div class="section">
            <h3>💡 Tips & Insights</h3>
            <ul>
                <li>How to optimize your workflow</li>
                <li>Best practices for success</li>
                <li>Industry trends to watch</li>
            </ul>
        </div>
        
        <div class="section">
            <h3>🎯 Upcoming Events</h3>
            <p>Don''t miss these important dates:</p>
            <ul>
                <li>Webinar: "Future of Technology" - Next Tuesday</li>
                <li>Conference: Annual Summit - March 15-17</li>
            </ul>
            <a href="https://example.com/events" class="button">Register Now</a>
        </div>
        
        <p>Thank you for being part of our community!</p>
        <p>Best regards,<br>The {{company_name}} Team</p>
    </div>
    
    <div class="footer">
        <p>{{company_name}} | {{company_address}}</p>
        <p>📧 {{company_email}} | 📞 {{company_phone}}</p>
        <p><a href="{{unsubscribe_url}}" style="color: #bdc3c7;">Unsubscribe</a> | <a href="{{preferences_url}}" style="color: #bdc3c7;">Update Preferences</a></p>
    </div>
</body>
</html>',
  true,
  now(),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.templates WHERE name = 'Newsletter Template' AND is_default = true
);

-- Add Promotional Email Template
INSERT INTO public.templates (user_id, name, description, html_content, is_default, created_at, updated_at)
SELECT 
  '00000000-0000-0000-0000-000000000000',
  'Promotional Email',
  'An attractive promotional email template with call-to-action buttons',
  '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{subject}}</title>
    <style>
        body { font-family: ''Segoe UI'', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 40px; text-align: center; border-radius: 8px; margin-bottom: 20px; }
        .offer-box { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; border-radius: 8px; text-align: center; margin: 20px 0; }
        .price { font-size: 48px; font-weight: bold; margin: 10px 0; }
        .original-price { text-decoration: line-through; opacity: 0.7; font-size: 24px; }
        .cta-button { display: inline-block; background-color: #fff; color: #f5576c; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 18px; margin: 20px 0; }
        .features { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .features ul { list-style: none; padding: 0; }
        .features li { padding: 8px 0; position: relative; padding-left: 25px; }
        .features li:before { content: "✓"; color: #27ae60; font-weight: bold; position: absolute; left: 0; }
        .footer { background-color: #2c3e50; color: white; padding: 20px; text-align: center; border-radius: 8px; margin-top: 20px; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎉 Special Offer Just for You!</h1>
        <p>Don''t miss this exclusive opportunity, {{first_name}}!</p>
    </div>
    
    <div class="content">
        <div class="offer-box">
            <h2>LIMITED TIME OFFER</h2>
            <div class="price">50% OFF</div>
            <div class="original-price">$200</div>
            <div style="font-size: 24px; margin: 10px 0;">Now Only $100</div>
            <a href="https://example.com/offer" class="cta-button">Claim Your Discount</a>
            <p style="margin-top: 15px; font-size: 14px;">Offer expires in 48 hours!</p>
        </div>
        
        <h2>What You''ll Get:</h2>
        <div class="features">
            <ul>
                <li>Premium access to all features</li>
                <li>24/7 customer support</li>
                <li>Exclusive content and resources</li>
                <li>30-day money-back guarantee</li>
            </ul>
        </div>
        
        <p style="text-align: center; margin: 30px 0;">
            <a href="https://example.com/offer" class="cta-button">Get Started Now</a>
        </p>
        
        <p style="text-align: center; color: #666; font-size: 14px;">
            Questions? Contact us at {{company_email}} or call {{company_phone}}
        </p>
    </div>
    
    <div class="footer">
        <p>{{company_name}} | {{company_address}}</p>
        <p><a href="{{unsubscribe_url}}" style="color: #bdc3c7;">Unsubscribe</a> | <a href="{{preferences_url}}" style="color: #bdc3c7;">Update Preferences</a></p>
    </div>
</body>
</html>',
  true,
  now(),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.templates WHERE name = 'Promotional Email' AND is_default = true
);

-- Add Event Invitation Template
INSERT INTO public.templates (user_id, name, description, html_content, is_default, created_at, updated_at)
SELECT 
  '00000000-0000-0000-0000-000000000000',
  'Event Invitation',
  'A professional event invitation template with RSVP functionality',
  '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{subject}}</title>
    <style>
        body { font-family: ''Segoe UI'', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; border-radius: 8px; margin-bottom: 20px; }
        .event-details { background-color: #f8f9fa; padding: 25px; border-radius: 8px; margin: 20px 0; }
        .event-details h3 { color: #667eea; margin-bottom: 15px; }
        .event-details p { margin: 10px 0; }
        .rsvp-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px; margin: 20px 10px; }
        .decline-button { display: inline-block; background-color: #6c757d; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px; margin: 20px 10px; }
        .agenda { background-color: #fff; border: 2px solid #667eea; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .agenda h4 { color: #667eea; margin-bottom: 15px; }
        .agenda ul { list-style: none; padding: 0; }
        .agenda li { padding: 10px 0; border-bottom: 1px solid #eee; }
        .agenda li:last-child { border-bottom: none; }
        .footer { background-color: #2c3e50; color: white; padding: 20px; text-align: center; border-radius: 8px; margin-top: 20px; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎉 You''re Invited!</h1>
        <p>Join us for an exclusive event</p>
    </div>
    
    <div class="content">
        <h2>Dear {{first_name}},</h2>
        
        <p>We''re excited to invite you to our upcoming event. This is a great opportunity to network, learn, and grow with industry leaders.</p>
        
        <div class="event-details">
            <h3>📅 Event Details</h3>
            <p><strong>Event:</strong> Annual Technology Summit 2024</p>
            <p><strong>Date:</strong> March 15-17, 2024</p>
            <p><strong>Time:</strong> 9:00 AM - 6:00 PM</p>
            <p><strong>Location:</strong> Convention Center, Downtown</p>
            <p><strong>Address:</strong> 123 Main Street, City, State 12345</p>
        </div>
        
        <div class="agenda">
            <h4>📋 Event Agenda</h4>
            <ul>
                <li><strong>9:00 AM</strong> - Registration & Networking</li>
                <li><strong>10:00 AM</strong> - Keynote Speech</li>
                <li><strong>11:30 AM</strong> - Panel Discussion</li>
                <li><strong>1:00 PM</strong> - Lunch & Networking</li>
                <li><strong>2:30 PM</strong> - Breakout Sessions</li>
                <li><strong>4:30 PM</strong> - Closing Remarks</li>
            </ul>
        </div>
        
        <p style="text-align: center; margin: 30px 0;">
            <a href="https://example.com/rsvp/yes" class="rsvp-button">I''ll Attend</a>
            <a href="https://example.com/rsvp/no" class="decline-button">I Can''t Make It</a>
        </p>
        
        <p style="text-align: center; color: #666; font-size: 14px;">
            Please RSVP by March 10th, 2024
        </p>
        
        <p>We look forward to seeing you there!</p>
        <p>Best regards,<br>The {{company_name}} Team</p>
    </div>
    
    <div class="footer">
        <p>{{company_name}} | {{company_address}}</p>
        <p>📧 {{company_email}} | 📞 {{company_phone}}</p>
        <p><a href="{{unsubscribe_url}}" style="color: #bdc3c7;">Unsubscribe</a> | <a href="{{preferences_url}}" style="color: #bdc3c7;">Update Preferences</a></p>
    </div>
</body>
</html>',
  true,
  now(),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.templates WHERE name = 'Event Invitation' AND is_default = true
);

-- Add Product Announcement Template
INSERT INTO public.templates (user_id, name, description, html_content, is_default, created_at, updated_at)
SELECT 
  '00000000-0000-0000-0000-000000000000',
  'Product Announcement',
  'A professional product announcement template with features and benefits',
  '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{subject}}</title>
    <style>
        body { font-family: ''Segoe UI'', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 40px; text-align: center; border-radius: 8px; margin-bottom: 20px; }
        .product-image { text-align: center; margin: 20px 0; }
        .product-image img { max-width: 100%; height: auto; border-radius: 8px; }
        .features { background-color: #f8f9fa; padding: 25px; border-radius: 8px; margin: 20px 0; }
        .features h3 { color: #11998e; margin-bottom: 15px; }
        .features ul { list-style: none; padding: 0; }
        .features li { padding: 10px 0; position: relative; padding-left: 30px; }
        .features li:before { content: "🚀"; position: absolute; left: 0; }
        .pricing { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 25px; border-radius: 8px; text-align: center; margin: 20px 0; }
        .price { font-size: 36px; font-weight: bold; margin: 10px 0; }
        .cta-button { display: inline-block; background-color: #fff; color: #f5576c; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px; margin: 20px 0; }
        .testimonial { background-color: #fff; border-left: 4px solid #11998e; padding: 20px; margin: 20px 0; font-style: italic; }
        .footer { background-color: #2c3e50; color: white; padding: 20px; text-align: center; border-radius: 8px; margin-top: 20px; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎉 New Product Launch!</h1>
        <p>Introducing our latest innovation</p>
    </div>
    
    <div class="content">
        <h2>Hello {{first_name}}!</h2>
        
        <p>We''re thrilled to announce the launch of our newest product that will revolutionize how you work.</p>
        
        <div class="product-image">
            <img src="https://via.placeholder.com/500x300/11998e/ffffff?text=Product+Image" alt="Product Image">
        </div>
        
        <div class="features">
            <h3>✨ Key Features</h3>
            <ul>
                <li>Advanced automation capabilities</li>
                <li>Real-time analytics and reporting</li>
                <li>Seamless integration with existing tools</li>
                <li>24/7 customer support</li>
                <li>Mobile-friendly interface</li>
                <li>Enterprise-grade security</li>
            </ul>
        </div>
        
        <div class="pricing">
            <h3>💰 Special Launch Pricing</h3>
            <div class="price">$99/month</div>
            <p>Limited time offer - 30% off regular price</p>
            <a href="https://example.com/product" class="cta-button">Learn More & Get Started</a>
        </div>
        
        <div class="testimonial">
            <p>"This product has completely transformed our workflow. The automation features alone have saved us hours every week."</p>
            <p style="text-align: right; margin-top: 10px;"><strong>- Sarah Johnson, CEO</strong></p>
        </div>
        
        <p style="text-align: center; margin: 30px 0;">
            <a href="https://example.com/product" class="cta-button">Explore the Product</a>
        </p>
        
        <p>Questions? Contact our team at {{company_email}} or call {{company_phone}}.</p>
        
        <p>Best regards,<br>The {{company_name}} Team</p>
    </div>
    
    <div class="footer">
        <p>{{company_name}} | {{company_address}}</p>
        <p><a href="{{unsubscribe_url}}" style="color: #bdc3c7;">Unsubscribe</a> | <a href="{{preferences_url}}" style="color: #bdc3c7;">Update Preferences</a></p>
    </div>
</body>
</html>',
  true,
  now(),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.templates WHERE name = 'Product Announcement' AND is_default = true
); 