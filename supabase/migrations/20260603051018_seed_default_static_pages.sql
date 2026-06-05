/*
  # Seed Default Static Pages
  
  Creates default static pages for About, Privacy, Terms, Contact, and Disclaimer
  These can be edited by admins from the CMS panel.
*/

INSERT INTO static_pages (slug, title, content, seo_title, seo_description, is_active) VALUES
(
  'about',
  'About EVMotorHub',
  '<h2>Who We Are</h2><p>EVMotorHub is India''s leading electric vehicle marketplace and information portal. We are committed to accelerating the adoption of electric vehicles in India through education, comparison, and seamless discovery.</p><h2>Our Mission</h2><p>To make electric vehicle research, comparison, and purchase as simple as possible for every Indian.</p><h2>Why Choose Us</h2><ul><li>Comprehensive Vehicle Database - Compare 100+ EV models</li><li>Real-time Pricing - Get the latest prices from all manufacturers</li><li>Expert Reviews - In-depth reviews and comparisons</li><li>EMI Calculator - Calculate affordable payment plans</li><li>Charging Station Locator - Find charging stations near you</li></ul>',
  'About EVMotorHub - India''s Leading EV Marketplace',
  'Learn about EVMotorHub - your trusted source for electric vehicle information, comparisons, and reviews.',
  true
),
(
  'privacy',
  'Privacy Policy',
  '<h2>Introduction</h2><p>EVMotorHub (''we'', ''us'', ''our'', or ''Company'') operates the EVMotorHub website. This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our website and the choices you have associated with that data.</p><h2>Information Collection</h2><p>We collect various types of information for various purposes to provide and improve our service.</p><h2>Contact Us</h2><p>If you have any questions about this Privacy Policy, please contact us at hello@evmotorhub.in</p>',
  'Privacy Policy - EVMotorHub',
  'Read our privacy policy to understand how we protect your personal information.',
  true
),
(
  'terms',
  'Terms of Use',
  '<h2>Terms and Conditions</h2><p>Welcome to EVMotorHub. These terms and conditions outline the rules and regulations for the use of our website.</p><h2>Use License</h2><p>Permission is granted to temporarily download one copy of the materials (information or software) on EVMotorHub''s website for personal, non-commercial transitory viewing only.</p><h2>Disclaimer</h2><p>The materials on EVMotorHub''s website are provided on an ''as is'' basis. EVMotorHub makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p><h2>Contact</h2><p>For any queries regarding our terms, please contact hello@evmotorhub.in</p>',
  'Terms of Use - EVMotorHub',
  'Review our terms and conditions for using EVMotorHub.',
  true
),
(
  'contact',
  'Contact Us',
  '<h2>Get In Touch</h2><p>We''d love to hear from you! Have a question or suggestion? Send us a message.</p><h2>Contact Information</h2><ul><li>Email: hello@evmotorhub.in</li><li>Phone: +91 80 4567 8900</li><li>Address: Bengaluru, Karnataka, India</li></ul><h2>Business Hours</h2><p>Monday - Friday: 9:00 AM - 6:00 PM IST<br/>Saturday - Sunday: 10:00 AM - 4:00 PM IST</p>',
  'Contact EVMotorHub',
  'Get in touch with our team for queries and feedback.',
  true
),
(
  'disclaimer',
  'Disclaimer',
  '<h2>Disclaimer</h2><p>The information provided on EVMotorHub is for informational purposes only and is not intended to replace professional advice. We make no representations or warranties of any kind regarding the accuracy, completeness, or suitability of the information contained herein.</p><h2>Vehicle Information</h2><p>Prices, specifications, and availability of vehicles are subject to change. Please verify directly with manufacturers or authorized dealers before making a purchase decision.</p><h2>Financial Information</h2><p>EMI calculations are approximate and for reference only. Actual EMI may vary based on interest rates, processing fees, and other factors. Please consult with your financial institution for accurate information.</p><h2>External Links</h2><p>Our website may contain links to third-party websites. We are not responsible for their content or practices.</p>',
  'Disclaimer - EVMotorHub',
  'Important disclaimer regarding information on EVMotorHub.',
  true
) ON CONFLICT (slug) DO NOTHING;
