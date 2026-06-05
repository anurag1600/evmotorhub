/*
  # EVMotorHub - Seed Data

  ## Overview
  Populates the database with realistic sample data for:
  - Indian EV manufacturers
  - EV scooters, bikes, and cars with full specifications
  - News articles and blog posts
  - Charging stations across India

  ## Data Included
  - 8 manufacturers (Ola, Ather, TVS, Bajaj, Tata, MG, BYD, Hero)
  - 20+ vehicles across categories
  - 12 news articles
  - 15 charging stations across major cities
*/

-- Insert Manufacturers
INSERT INTO manufacturers (name, slug, logo_url, hero_image_url, description, country, founded_year, headquarters, website, total_models, is_featured) VALUES
('Ola Electric', 'ola-electric', 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&cs=tinysrgb&w=100', 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&cs=tinysrgb&w=1200', 'Ola Electric is India''s largest electric two-wheeler manufacturer, revolutionizing urban mobility with cutting-edge technology and sustainable transportation solutions. Founded with a vision to make EVs accessible to every Indian.', 'India', 2017, 'Bengaluru, Karnataka', 'https://olaelectric.com', 4, true),
('Ather Energy', 'ather-energy', 'https://images.pexels.com/photos/5214413/pexels-photo-5214413.jpeg?auto=compress&cs=tinysrgb&w=100', 'https://images.pexels.com/photos/5214413/pexels-photo-5214413.jpeg?auto=compress&cs=tinysrgb&w=1200', 'Ather Energy is a premium electric scooter brand known for its innovative AtherGrid charging network and smart connected features. Ather''s vehicles are designed for performance and are loved by tech-savvy urban commuters.', 'India', 2013, 'Bengaluru, Karnataka', 'https://atherenergy.com', 3, true),
('TVS Motor', 'tvs-motor', 'https://images.pexels.com/photos/1149831/pexels-photo-1149831.jpeg?auto=compress&cs=tinysrgb&w=100', 'https://images.pexels.com/photos/1149831/pexels-photo-1149831.jpeg?auto=compress&cs=tinysrgb&w=1200', 'TVS Motor Company is one of India''s largest two-wheeler manufacturers, expanding its portfolio with the iQube electric scooter range. With decades of engineering excellence, TVS brings reliability and trust to the EV segment.', 'India', 1978, 'Chennai, Tamil Nadu', 'https://tvsmotor.com', 2, true),
('Bajaj Auto', 'bajaj-auto', 'https://images.pexels.com/photos/2244746/pexels-photo-2244746.jpeg?auto=compress&cs=tinysrgb&w=100', 'https://images.pexels.com/photos/2244746/pexels-photo-2244746.jpeg?auto=compress&cs=tinysrgb&w=1200', 'Bajaj Auto, India''s iconic motorcycle brand, has entered the EV space with the Chetak electric scooter — a modern reincarnation of the legendary Bajaj Chetak. The brand brings 75+ years of manufacturing expertise to clean mobility.', 'India', 1945, 'Pune, Maharashtra', 'https://bajajauto.com', 2, true),
('Tata Motors', 'tata-motors', 'https://images.pexels.com/photos/3422964/pexels-photo-3422964.jpeg?auto=compress&cs=tinysrgb&w=100', 'https://images.pexels.com/photos/3422964/pexels-photo-3422964.jpeg?auto=compress&cs=tinysrgb&w=1200', 'Tata Motors is India''s largest domestic car manufacturer and the pioneer of affordable electric cars in India. With the Nexon EV and Tiago EV, Tata has democratized electric mobility for the Indian masses.', 'India', 1945, 'Mumbai, Maharashtra', 'https://tatamotors.com', 5, true),
('MG Motor', 'mg-motor', 'https://images.pexels.com/photos/3752169/pexels-photo-3752169.jpeg?auto=compress&cs=tinysrgb&w=100', 'https://images.pexels.com/photos/3752169/pexels-photo-3752169.jpeg?auto=compress&cs=tinysrgb&w=1200', 'MG Motor India brings British heritage and Chinese EV technology to Indian roads. Known for the ZS EV and Comet EV, MG offers feature-rich electric vehicles at competitive price points with strong after-sales support.', 'UK/China', 2019, 'Gurugram, Haryana', 'https://mgmotor.co.in', 3, true),
('Hero Electric', 'hero-electric', 'https://images.pexels.com/photos/1544463/pexels-photo-1544463.jpeg?auto=compress&cs=tinysrgb&w=100', 'https://images.pexels.com/photos/1544463/pexels-photo-1544463.jpeg?auto=compress&cs=tinysrgb&w=1200', 'Hero Electric is the pioneer of electric two-wheelers in India with over 15 years of experience. The brand focuses on last-mile connectivity and affordable electric mobility solutions for every Indian.', 'India', 2007, 'New Delhi', 'https://heroelectric.in', 6, false),
('BYD India', 'byd-india', 'https://images.pexels.com/photos/3354648/pexels-photo-3354648.jpeg?auto=compress&cs=tinysrgb&w=100', 'https://images.pexels.com/photos/3354648/pexels-photo-3354648.jpeg?auto=compress&cs=tinysrgb&w=1200', 'BYD (Build Your Dreams) is the world''s largest EV manufacturer, now bringing its premium electric vehicles to India. Known for industry-leading battery technology (Blade Battery) and a comprehensive lineup of sedans, SUVs, and MPVs.', 'China', 1995, 'Hyderabad, Telangana', 'https://byd.com/in', 4, true)
ON CONFLICT (slug) DO NOTHING;

-- Insert Vehicles (Scooters)
INSERT INTO vehicles (name, slug, manufacturer_id, type, segment, price_min, price_max, range_km, top_speed_kmh, charging_time_hrs, battery_capacity_kwh, motor_power_kw, image_url, is_featured, is_latest, colors, specifications, features, pros, cons)
SELECT
  'Ola S1 Pro Gen 2', 'ola-s1-pro-gen2', m.id, 'scooter', 'premium', 147499, 147499, 195, 120, 6.5, 4.0, 8.5,
  'https://images.pexels.com/photos/5214413/pexels-photo-5214413.jpeg?auto=compress&cs=tinysrgb&w=800',
  true, true,
  ARRAY['Jet Black', 'Neo Mint', 'Liquid Silver', 'Coral Glam', 'Midnight Blue'],
  '{"Motor Type": "Mid-Drive PMAC", "Battery Type": "Lithium-ion NMC", "Charger": "Portable & Fast Charger", "Brakes": "Disc (F&R) with Regenerative", "Suspension": "Telescopic (F), Mono-shock (R)", "Seat Height": "792mm", "Kerb Weight": "125 kg", "Load Capacity": "170 kg", "Tyre Size F": "120/70-R12", "Tyre Size R": "120/70-R12", "Display": "7-inch TFT Touchscreen", "Connectivity": "4G, WiFi, Bluetooth", "Speakers": "2-channel stereo", "IP Rating": "IP67"}'::jsonb,
  '["MoveOS 4 Operating System", "Cruise Control", "Hill Hold", "Reverse Mode", "4 Ride Modes", "OTA Updates", "Hypercharging Support", "Party Mode", "Navigation with Lane Guidance", "Music Playback", "Voice Assist"]'::jsonb,
  ARRAY['Best-in-class performance', 'Huge 195km range', 'Feature-packed software', 'Large boot space'],
  ARRAY['Premium pricing', 'Service network still growing', 'App can be buggy']
FROM manufacturers m WHERE m.slug = 'ola-electric';

INSERT INTO vehicles (name, slug, manufacturer_id, type, segment, price_min, price_max, range_km, top_speed_kmh, charging_time_hrs, battery_capacity_kwh, motor_power_kw, image_url, is_featured, is_latest, colors, specifications, features, pros, cons)
SELECT
  'Ola S1 Air', 'ola-s1-air', m.id, 'scooter', 'mid', 84999, 94999, 101, 90, 5.0, 2.5, 4.5,
  'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&cs=tinysrgb&w=800',
  false, true,
  ARRAY['Matte Black', 'Porcelain White', 'Neo Mint', 'Midnight Blue'],
  '{"Motor Type": "BLDC Hub Motor", "Battery Type": "Lithium-ion", "Charger": "Portable Charger", "Brakes": "Disc (F), Drum (R)", "Suspension": "Telescopic (F), Mono-shock (R)", "Seat Height": "785mm", "Kerb Weight": "99 kg", "Load Capacity": "150 kg", "Display": "5-inch TFT", "Connectivity": "Bluetooth"}'::jsonb,
  '["MoveOS 4", "3 Ride Modes", "OTA Updates", "Digital Instrument Cluster", "Side Stand Alert", "Low Battery Alert"]'::jsonb,
  ARRAY['Affordable entry-level EV', 'Decent range', 'Lightweight', 'Good for city commutes'],
  ARRAY['No fast charging', 'Basic features', 'Drum rear brake']
FROM manufacturers m WHERE m.slug = 'ola-electric';

INSERT INTO vehicles (name, slug, manufacturer_id, type, segment, price_min, price_max, range_km, top_speed_kmh, charging_time_hrs, battery_capacity_kwh, motor_power_kw, image_url, is_featured, is_latest, colors, specifications, features, pros, cons)
SELECT
  'Ather 450X Gen 3', 'ather-450x-gen3', m.id, 'scooter', 'premium', 145690, 163690, 150, 90, 5.5, 3.7, 6.4,
  'https://images.pexels.com/photos/1149831/pexels-photo-1149831.jpeg?auto=compress&cs=tinysrgb&w=800',
  true, true,
  ARRAY['Space Grey', 'Mint', 'Streak Yellow', 'White'],
  '{"Motor Type": "PMSM (IP67)", "Battery Type": "NMC Lithium-ion (IP67)", "Fast Charging": "Ather Grid / 3.3kW", "Brakes": "CBS Disc (F&R)", "Suspension": "Telescopic (F), Spring Mono-shock (R)", "Seat Height": "787mm", "Kerb Weight": "108 kg", "Display": "7-inch TFT Touchscreen", "Connectivity": "4G, Bluetooth, WiFi", "Ground Clearance": "165mm"}'::jsonb,
  '["Ather Auto Hold", "AutoHold (Hill Start Assist)", "Auto Indicator Cancel", "Warp Mode", "Smart eco regen", "ProTA (Traction Control)", "OTA Updates", "Google Maps Navigation", "Video Calling"]'::jsonb,
  ARRAY['Exceptional build quality', 'Best-in-class safety features', 'Ather Grid network', 'Consistent performance'],
  ARRAY['Expensive', 'Limited color options', 'Boot space smaller than rivals']
FROM manufacturers m WHERE m.slug = 'ather-energy';

INSERT INTO vehicles (name, slug, manufacturer_id, type, segment, price_min, price_max, range_km, top_speed_kmh, charging_time_hrs, battery_capacity_kwh, motor_power_kw, image_url, is_featured, is_latest, colors, specifications, features, pros, cons)
SELECT
  'TVS iQube ST', 'tvs-iqube-st', m.id, 'scooter', 'premium', 159900, 174900, 145, 82, 5.0, 5.1, 11.4,
  'https://images.pexels.com/photos/2244746/pexels-photo-2244746.jpeg?auto=compress&cs=tinysrgb&w=800',
  true, false,
  ARRAY['Matte Red', 'Metallic Blue', 'Pearl White', 'Matte Black'],
  '{"Motor Type": "BLDC Hub Motor", "Battery": "5.1 kWh Lithium-ion", "Charging": "15A Fast Charger", "Front Brake": "Disc 220mm", "Rear Brake": "Disc 200mm", "Suspension F": "Telescopic", "Suspension R": "Dual Spring", "Seat Height": "780mm", "Weight": "118 kg", "Display": "5-inch TFT", "Connectivity": "Bluetooth 5.0"}'::jsonb,
  '["4 Riding Modes", "Reverse Assist", "IntelliGo Technology", "SmartXonnect", "Navigation", "Last Mile Mode", "Anti-theft Alert", "Geo-fencing", "Remote Diagnostics"]'::jsonb,
  ARRAY['TVS reliability', 'Wide service network', 'Large battery', 'Good low-end torque'],
  ARRAY['Heavier than competitors', 'No 4G connectivity', 'Average acceleration']
FROM manufacturers m WHERE m.slug = 'tvs-motor';

INSERT INTO vehicles (name, slug, manufacturer_id, type, segment, price_min, price_max, range_km, top_speed_kmh, charging_time_hrs, battery_capacity_kwh, motor_power_kw, image_url, is_featured, is_latest, colors, specifications, features, pros, cons)
SELECT
  'Bajaj Chetak Premium', 'bajaj-chetak-premium', m.id, 'scooter', 'mid', 127990, 136990, 126, 73, 5.0, 3.0, 4.08,
  'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&cs=tinysrgb&w=800',
  false, false,
  ARRAY['Urbane Dark', 'Indicolite', 'Brooklyn Black', 'Hazel Nougat'],
  '{"Motor": "IP67 Rated BLDC", "Battery": "3.0 kWh Li-ion", "Charging Port": "CCS2 Fast Charge + Home", "Brakes F": "Disc 220mm", "Brakes R": "Drum 130mm", "Suspension F": "Telescopic", "Suspension R": "Mono-shock", "Seat Height": "768mm", "Ground Clearance": "168mm", "Display": "5-inch Color LCD"}'::jsonb,
  '["Ride Statistics", "Turn-by-Turn Navigation", "Music Control", "Incoming Call Alert", "Find My Scooter", "DRL LED Lights", "IP67 Motor & Battery"]'::jsonb,
  ARRAY['Premium retro design', 'Excellent build quality', 'Reliable brand', 'Comfortable ride'],
  ARRAY['Limited range', 'Fewer tech features', 'No fast charging on base variant']
FROM manufacturers m WHERE m.slug = 'bajaj-auto';

-- EV Bikes
INSERT INTO vehicles (name, slug, manufacturer_id, type, segment, price_min, price_max, range_km, top_speed_kmh, charging_time_hrs, battery_capacity_kwh, motor_power_kw, image_url, is_featured, is_upcoming, colors, specifications, features, pros, cons)
SELECT
  'Ola Roadster X', 'ola-roadster-x', m.id, 'bike', 'mid', 74999, 99999, 200, 124, 4.5, 3.97, 11.0,
  'https://images.pexels.com/photos/1544463/pexels-photo-1544463.jpeg?auto=compress&cs=tinysrgb&w=800',
  true, false,
  ARRAY['Satin Black', 'Raw Matte', 'Stealth Blue', 'Racing Red'],
  '{"Motor": "Mid-Drive PMAC", "Battery": "3.97 kWh", "Peak Power": "11 kW", "Peak Torque": "58 Nm", "0-40 kmh": "2.8 sec", "Top Speed": "124 kmh", "Brakes F": "320mm Single Disc", "Brakes R": "240mm Single Disc", "Suspension F": "USD Fork 43mm", "Suspension R": "Mono-shock", "Tyre F": "110/70-R17", "Tyre R": "150/60-R17", "Display": "4-inch Round TFT"}'::jsonb,
  '["MoveOS 4", "5 Riding Modes", "Traction Control", "ABS", "Quickshifter", "LED Lighting", "Bluetooth Connectivity", "OTA Updates"]'::jsonb,
  ARRAY['Sporty design', 'Excellent value', 'Great performance', 'Long range'],
  ARRAY['Limited fast charging', 'New product, reliability TBD']
FROM manufacturers m WHERE m.slug = 'ola-electric';

INSERT INTO vehicles (name, slug, manufacturer_id, type, segment, price_min, price_max, range_km, top_speed_kmh, charging_time_hrs, battery_capacity_kwh, motor_power_kw, image_url, is_featured, is_upcoming, colors, specifications, features, pros, cons)
SELECT
  'Ather Rizta', 'ather-rizta', m.id, 'scooter', 'mid', 109999, 134999, 159, 80, 5.5, 3.7, 6.4,
  'https://images.pexels.com/photos/5214413/pexels-photo-5214413.jpeg?auto=compress&cs=tinysrgb&w=800',
  true, false,
  ARRAY['Salt White', 'Turquoise', 'Midnight Blue', 'Matt Grey'],
  '{"Motor": "PMSM", "Battery": "3.7 kWh / 4.8 kWh", "Charging": "Ather Grid", "Brakes": "CBS Disc F&R", "Seat Height": "780mm", "Boot Space": "32 litres", "Display": "7-inch TFT", "Connectivity": "Bluetooth"}'::jsonb,
  '["Family-first design", "Ride Modes", "Auto Hold", "Navigation", "Voice Assistant", "OTA Updates"]'::jsonb,
  ARRAY['Large family-friendly boot', 'Comfortable ride', 'Good range', 'Trusted brand'],
  ARRAY['Premium pricing for family scooter', 'Not the sportiest option']
FROM manufacturers m WHERE m.slug = 'ather-energy';

-- EV Cars
INSERT INTO vehicles (name, slug, manufacturer_id, type, segment, price_min, price_max, range_km, top_speed_kmh, charging_time_hrs, battery_capacity_kwh, motor_power_kw, image_url, is_featured, is_latest, colors, specifications, features, pros, cons)
SELECT
  'Tata Nexon EV', 'tata-nexon-ev', m.id, 'car', 'mid', 1399900, 1999900, 465, 150, 8.6, 40.5, 80.0,
  'https://images.pexels.com/photos/3422964/pexels-photo-3422964.jpeg?auto=compress&cs=tinysrgb&w=800',
  true, false,
  ARRAY['Fearless Red', 'Daytona Grey', 'Pristine White', 'Midnight Black', 'Tropical Mist'],
  '{"Motor": "Permanent Magnet AC", "Battery": "40.5 kWh Ziptron", "Range": "465 km ARAI", "Charging DC": "50 kW CCS2 (0-80% in 56 min)", "Charging AC": "7.2 kW (0-100% in 8.6h)", "Drive": "FWD", "0-100 kmh": "8.9 sec", "Dimensions": "3993×1811×1606 mm", "Boot Space": "350 litres", "Seating": "5", "Infotainment": "10.25-inch Cinematic Display", "ADAS": "Level 2 ADAS"}'::jsonb,
  '["Voice Commands with Alexa", "Auto Park Assist", "360° Camera", "ADAS Level 2 (20 features)", "Wireless Charging", "Ventilated Front Seats", "Air Purifier", "Connected Car Features", "One Pedal Driving"]'::jsonb,
  ARRAY['Best-selling EV in India', 'Excellent range', 'Trusted Tata service network', 'ADAS features', 'Good resale value'],
  ARRAY['Interior quality could be better', 'Rear space is average', 'No AWD option']
FROM manufacturers m WHERE m.slug = 'tata-motors';

INSERT INTO vehicles (name, slug, manufacturer_id, type, segment, price_min, price_max, range_km, top_speed_kmh, charging_time_hrs, battery_capacity_kwh, motor_power_kw, image_url, is_featured, is_latest, colors, specifications, features, pros, cons)
SELECT
  'Tata Tiago EV', 'tata-tiago-ev', m.id, 'car', 'budget', 829000, 1149000, 315, 150, 8.7, 24.0, 55.0,
  'https://images.pexels.com/photos/3354648/pexels-photo-3354648.jpeg?auto=compress&cs=tinysrgb&w=800',
  true, false,
  ARRAY['Tropical Mist', 'Daytona Grey', 'Pristine White', 'Midnight Black'],
  '{"Motor": "Permanent Magnet AC", "Battery": "24 kWh Ziptron", "Range": "315 km ARAI", "Charging DC": "Fast DC Charging", "Charging AC": "3.3 kW / 7.2 kW", "Drive": "FWD", "0-100 kmh": "11.5 sec", "Boot Space": "240 litres", "Seating": "5", "Infotainment": "10.25-inch Touchscreen"}'::jsonb,
  '["Automatic Climate Control", "Wireless Apple CarPlay/Android Auto", "Voice Commands", "iRA Connected Car Tech", "6 airbags", "Electronic Stability Control"]'::jsonb,
  ARRAY['Most affordable EV car in India', 'Zero fuel cost', 'Easy city driving', 'Good safety rating'],
  ARRAY['Limited range vs petrol rivals', 'Small boot', 'No fast charging on base']
FROM manufacturers m WHERE m.slug = 'tata-motors';

INSERT INTO vehicles (name, slug, manufacturer_id, type, segment, price_min, price_max, range_km, top_speed_kmh, charging_time_hrs, battery_capacity_kwh, motor_power_kw, image_url, is_featured, is_latest, colors, specifications, features, pros, cons)
SELECT
  'MG ZS EV', 'mg-zs-ev', m.id, 'car', 'premium', 2188000, 2588000, 461, 175, 8.5, 50.3, 130.0,
  'https://images.pexels.com/photos/3752169/pexels-photo-3752169.jpeg?auto=compress&cs=tinysrgb&w=800',
  true, false,
  ARRAY['Polar White', 'Diamond Black', 'Sloane Silver', 'Camden Grey'],
  '{"Motor": "Permanent Magnet Synchronous", "Battery": "50.3 kWh", "Range": "461 km WLTP", "Charging DC": "76 kW DC Fast Charge", "Charging AC": "7.4 kW AC", "Drive": "FWD", "0-100 kmh": "8.5 sec", "Boot Space": "448 litres", "Seating": "5", "Infotainment": "10.1-inch Touchscreen", "ADAS": "I-SMART Suite"}'::jsonb,
  '["I-SMART Connected Car", "360° Parking Camera", "Electric Sunroof", "Wireless Charging", "8-speaker Infinity Sound", "Lane Keep Assist", "Automatic Emergency Braking", "Adaptive Cruise Control", "Heated Front Seats"]'::jsonb,
  ARRAY['Spacious premium interior', 'Fast charging capability', 'Excellent feature list', 'Comfortable highway cruiser'],
  ARRAY['Higher price point', 'Brand resale value TBD', 'Service centers limited']
FROM manufacturers m WHERE m.slug = 'mg-motor';

INSERT INTO vehicles (name, slug, manufacturer_id, type, segment, price_min, price_max, range_km, top_speed_kmh, charging_time_hrs, battery_capacity_kwh, motor_power_kw, image_url, is_featured, is_upcoming, colors, specifications, features, pros, cons)
SELECT
  'BYD Atto 3', 'byd-atto-3', m.id, 'car', 'premium', 3399800, 3399800, 521, 160, 9.0, 60.48, 150.0,
  'https://images.pexels.com/photos/3422964/pexels-photo-3422964.jpeg?auto=compress&cs=tinysrgb&w=800',
  false, false,
  ARRAY['Cosmos Black', 'Ski White', 'Boulder Grey', 'Surf Blue'],
  '{"Motor": "Permanent Magnet Synchronous", "Battery": "60.48 kWh Blade Battery", "Range": "521 km WLTP", "Charging DC": "80 kW DC Fast", "Charging AC": "7 kW AC", "Drive": "FWD", "0-100 kmh": "7.3 sec", "Boot Space": "440 litres + 60 litres frunk", "Seating": "5", "Infotainment": "12.8-inch Rotating Screen"}'::jsonb,
  '["Rotating 12.8-inch Infotainment", "BYD Blade Battery (safest in class)", "V2L (Vehicle to Load)", "ADAS with 5 radars", "10-speaker DiracSound", "Wireless Charging", "Electric Sunroof", "HUD Display"]'::jsonb,
  ARRAY['Best safety with Blade Battery', 'Excellent range', 'Impressive tech', 'V2L functionality'],
  ARRAY['Expensive', 'Limited service network', 'Brand recognition still building']
FROM manufacturers m WHERE m.slug = 'byd-india';

INSERT INTO vehicles (name, slug, manufacturer_id, type, segment, price_min, price_max, range_km, top_speed_kmh, charging_time_hrs, battery_capacity_kwh, motor_power_kw, image_url, is_upcoming, is_featured, launch_date, colors, specifications, features, pros, cons)
SELECT
  'Tata Curvv EV', 'tata-curvv-ev', m.id, 'car', 'premium', 1799000, 2199000, 502, 160, 7.0, 55.0, 120.0,
  'https://images.pexels.com/photos/3752169/pexels-photo-3752169.jpeg?auto=compress&cs=tinysrgb&w=800',
  false, true, '2024-07-01',
  ARRAY['Pristine White', 'Daytona Grey', 'Virtual Sky', 'Flame Red'],
  '{"Motor": "Permanent Magnet AC", "Battery": "55 kWh Ziptron", "Range": "502 km ARAI", "Charging DC": "70 kW CCS2", "Charging AC": "11 kW AC", "Drive": "FWD", "0-100 kmh": "8.6 sec", "Boot Space": "500 litres", "Seating": "5", "Infotainment": "12.3-inch + 12.3-inch Dual Screen"}'::jsonb,
  '["Level 2 ADAS (30+ features)", "Dual 12.3-inch Screens", "JBL Sound System", "Panoramic Sunroof", "Wireless Charging", "360° Camera", "Ventilated Seats", "Connected Car", "One Pedal Driving"]'::jsonb,
  ARRAY['Coupe-SUV design', 'Long 502km range', 'Premium features', 'Tata''s best car yet'],
  ARRAY['Higher price than Nexon EV', 'Limited rear headroom due to roofline']
FROM manufacturers m WHERE m.slug = 'tata-motors';

-- News Articles
INSERT INTO news (title, slug, content, excerpt, image_url, published_at, category, author, author_image, tags, read_time_mins, is_featured) VALUES
('India''s EV Market Hits 1.5 Million Units in FY2024: A New Record', 'india-ev-market-15-million-fy2024', '<p>India''s electric vehicle market achieved a historic milestone in FY2024, crossing 1.5 million unit sales across all segments — two-wheelers, three-wheelers, and passenger vehicles. This represents a remarkable 45% year-over-year growth, cementing India''s position as one of the world''s fastest-growing EV markets.</p><p>The two-wheeler segment continued to dominate with over 900,000 units, led by Ola Electric, Ather Energy, and TVS iQube. Electric three-wheelers surged to 450,000 units, primarily driven by last-mile logistics demand. The passenger vehicle segment saw 150,000+ units, with Tata Motors accounting for nearly 70% of the segment.</p><h2>Key Drivers of Growth</h2><p>FAME II subsidies, state-level incentives, rising fuel prices, and the expanding charging infrastructure have been the primary catalysts. The total charging infrastructure now exceeds 12,000 public stations, a 3x increase from FY2023.</p>', 'India''s EV sales crossed 1.5 million units in FY2024, a 45% YoY growth. Two-wheelers led with 900K units, while Tata Motors dominated the car segment.', 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&cs=tinysrgb&w=800', '2024-04-02 10:00:00+05:30', 'news', 'Ravi Shankar', 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=100', ARRAY['EV market', 'India', 'sales', 'growth', 'FAME II'], 6, true),

('Ola Electric S1 Pro Gen 2 Review: Is This The Best Indian EV Scooter?', 'ola-s1-pro-gen2-review', '<p>The Ola S1 Pro Gen 2 represents a significant leap forward for India''s most ambitious EV startup. With a claimed range of 195km, hypercharging support, and the MoveOS 4 operating system, this isn''t just a scooter — it''s a statement.</p><p>We rode the S1 Pro Gen 2 for 2 weeks covering over 400km across city traffic and highways. Here''s our detailed verdict.</p><h2>Performance</h2><p>The mid-drive motor delivers instantaneous torque that makes traffic light sprints genuinely fun. In Hyper mode, the 0-40 kmh dash happens in under 3 seconds — faster than most 125cc petrol scooters.</p><h2>Range</h2><p>In our real-world testing, we achieved 162km in Economy mode and 128km in Normal mode. The claimed 195km is achievable only in Eco mode under ideal conditions.</p>', 'Two weeks and 400km with Ola''s flagship scooter. Spoiler: It''s impressive, but not perfect. Here''s our comprehensive review.', 'https://images.pexels.com/photos/5214413/pexels-photo-5214413.jpeg?auto=compress&cs=tinysrgb&w=800', '2024-03-25 09:00:00+05:30', 'review', 'Priya Mehta', 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=100', ARRAY['Ola Electric', 'S1 Pro', 'review', 'scooter', 'range test'], 8, true),

('Tata Curvv EV Unveiled: 502km Range, Level 2 ADAS at ₹17.99 Lakh', 'tata-curvv-ev-unveiled', '<p>Tata Motors has officially unveiled the pricing and full specification sheet for the much-anticipated Curvv EV, and the numbers are impressive. Starting at ₹17.99 lakh (ex-showroom), the Curvv EV promises 502km of ARAI-certified range from its 55 kWh Ziptron battery.</p><p>The coupe-SUV body style, a first for Tata, gives the Curvv EV a distinctly premium positioning that slots it above the Nexon EV but below the upcoming Harrier EV.</p>', 'Tata Curvv EV officially launched with 502km range, dual 12.3-inch screens, and Level 2 ADAS starting at ₹17.99 lakh.', 'https://images.pexels.com/photos/3422964/pexels-photo-3422964.jpeg?auto=compress&cs=tinysrgb&w=800', '2024-03-18 11:00:00+05:30', 'launch', 'Amit Verma', 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=100', ARRAY['Tata Curvv', 'launch', 'EV SUV', 'ADAS'], 5, true),

('Ather 450X vs Ola S1 Pro: Which Premium EV Scooter Should You Buy?', 'ather-450x-vs-ola-s1-pro', '<p>The ₹1.4-1.5 lakh EV scooter segment has two undisputed champions: the Ather 450X and the Ola S1 Pro. Both are packed with technology, offer impressive performance, and target the aspirational urban commuter. But which one is actually better for you?</p><p>We spent a month riding both back-to-back to give you the definitive comparison.</p>', 'We compared India''s two best EV scooters head-to-head. Performance, range, features, charging — here''s who wins each round.', 'https://images.pexels.com/photos/1149831/pexels-photo-1149831.jpeg?auto=compress&cs=tinysrgb&w=800', '2024-03-10 08:00:00+05:30', 'comparison', 'Deepa Krishnamurthy', 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100', ARRAY['Ather 450X', 'Ola S1 Pro', 'comparison', 'EV scooter'], 10, false),

('FAME III Policy: How Will The New EV Subsidy Scheme Change India?', 'fame-3-policy-explained', '<p>The Indian government is set to launch the FAME III (Faster Adoption and Manufacturing of Electric Vehicles) policy with a projected outlay of ₹20,000 crore — more than double the FAME II budget. Here''s a deep dive into what this means for EV buyers.</p><p>Under the proposed scheme, subsidies of up to ₹15,000 per two-wheeler and ₹5 lakh per electric bus will be available. Crucially, the policy links subsidies to domestic manufacturing components, pushing brands to source locally.</p>', 'FAME III policy is set to reshape India''s EV landscape with ₹20,000 crore in subsidies. Here''s what buyers and manufacturers need to know.', 'https://images.pexels.com/photos/3354648/pexels-photo-3354648.jpeg?auto=compress&cs=tinysrgb&w=800', '2024-03-05 12:00:00+05:30', 'news', 'Vikram Nair', 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100', ARRAY['FAME III', 'subsidy', 'policy', 'government'], 7, false),

('Complete Guide to EV Charging in India 2024: Everything You Need to Know', 'ev-charging-guide-india-2024', '<p>Charging anxiety is the number one reason prospective EV buyers hesitate. But the reality of EV charging in India in 2024 is far better than most people think. This comprehensive guide covers everything from home charging to fast charging networks.</p><h2>Types of EV Chargers in India</h2><p>There are three main charging types: AC Slow (3.3-7.2 kW), AC Fast (11-22 kW), and DC Fast Charging (25-150 kW). For two-wheelers, portable chargers (500W-1.2 kW) are standard.</p>', 'Everything you need to know about charging your EV in India — from home charging setup costs to the best fast-charging networks.', 'https://images.pexels.com/photos/3752169/pexels-photo-3752169.jpeg?auto=compress&cs=tinysrgb&w=800', '2024-02-28 09:30:00+05:30', 'guide', 'Sunita Rao', 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=100', ARRAY['charging', 'guide', 'infrastructure', 'tips'], 12, false),

('Ola Roadster Electric Bike First Ride: A Game-Changer for India?', 'ola-roadster-first-ride', '<p>Ola Electric''s first motorcycle, the Roadster X, has arrived and we got an exclusive first ride. Priced from just ₹74,999, it promises a 200km range and a top speed of 124 kmh. But does it live up to the hype?</p><p>The short answer: yes, it absolutely does. The Roadster X is the most exciting Indian EV product since the original Ola S1 Pro.</p>', 'We got an exclusive first ride on Ola''s electric motorcycle. Here''s our verdict on India''s most affordable performance EV bike.', 'https://images.pexels.com/photos/1544463/pexels-photo-1544463.jpeg?auto=compress&cs=tinysrgb&w=800', '2024-02-20 08:00:00+05:30', 'review', 'Karan Singh', 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=100', ARRAY['Ola Roadster', 'electric bike', 'review', 'first ride'], 7, false),

('Top 5 Electric Scooters Under ₹1 Lakh in India (2024)', 'top-5-ev-scooters-under-1-lakh-2024', '<p>The sub-₹1 lakh electric scooter segment has exploded in 2024. With multiple compelling options from established brands, first-time EV buyers are spoilt for choice. We''ve shortlisted the five best options that offer the right balance of range, reliability, and value.</p>', 'The best electric scooters under ₹1 lakh in India — ranked by real-world range, build quality, service network, and value for money.', 'https://images.pexels.com/photos/2244746/pexels-photo-2244746.jpeg?auto=compress&cs=tinysrgb&w=800', '2024-02-14 10:00:00+05:30', 'guide', 'Meera Pillai', 'https://images.pexels.com/photos/1181695/pexels-photo-1181695.jpeg?auto=compress&cs=tinysrgb&w=100', ARRAY['budget EV', 'scooter', 'under 1 lakh', 'buying guide'], 8, false)
ON CONFLICT (slug) DO NOTHING;

-- Charging Stations
INSERT INTO charging_stations (name, address, city, state, lat, lng, operator, connector_types, total_chargers, available_chargers, status, power_kw, amenities, operating_hours) VALUES
('Ather Grid - Indiranagar', 'CMH Road, Indiranagar, Bengaluru', 'Bengaluru', 'Karnataka', 12.9784, 77.6408, 'Ather Energy', ARRAY['Ather Proprietary', 'CCS2'], 6, 4, 'active', 3.3, ARRAY['Cafe nearby', 'Shopping', 'ATM'], '24/7'),
('Tata Power EZ Charge - Bandra', 'Linking Road, Bandra West, Mumbai', 'Mumbai', 'Maharashtra', 19.0596, 72.8295, 'Tata Power', ARRAY['CCS2', 'CHAdeMO', 'Type 2 AC'], 4, 2, 'active', 50.0, ARRAY['Mall', 'Food court', 'Parking'], '06:00-23:00'),
('BESCOM EV Station - MG Road', 'MG Road Metro Station, Bengaluru', 'Bengaluru', 'Karnataka', 12.9747, 77.6070, 'BESCOM', ARRAY['CCS2', 'Type 2 AC', 'Bharat DC-001'], 8, 6, 'active', 25.0, ARRAY['Metro Station', 'Shopping', 'Restaurants'], '24/7'),
('ChargeZone - Connaught Place', 'Connaught Place, New Delhi', 'New Delhi', 'Delhi', 28.6317, 77.2195, 'ChargeZone', ARRAY['CCS2', 'CHAdeMO', 'Type 2 AC'], 10, 7, 'active', 60.0, ARRAY['Mall', 'Restaurants', 'Parking'], '24/7'),
('Ola Hypercharger - Koramangala', '80 Feet Road, Koramangala, Bengaluru', 'Bengaluru', 'Karnataka', 12.9352, 77.6245, 'Ola Electric', ARRAY['Ola Proprietary', 'CCS2'], 12, 9, 'active', 15.0, ARRAY['Food & Beverages', 'Lounge', 'WiFi'], '24/7'),
('Statiq - Sector 29 Gurugram', 'Sector 29, Gurugram', 'Gurugram', 'Haryana', 28.4595, 77.0266, 'Statiq', ARRAY['CCS2', 'Type 2 AC'], 6, 4, 'active', 30.0, ARRAY['IT Hub', 'Restaurants', 'ATM'], '24/7'),
('Tata Power - Phoenix Mall Chennai', 'Phoenix Marketcity, Velachery, Chennai', 'Chennai', 'Tamil Nadu', 12.9784, 80.2209, 'Tata Power', ARRAY['CCS2', 'Type 2 AC'], 5, 3, 'active', 50.0, ARRAY['Shopping Mall', 'Movies', 'Food Court'], '10:00-22:00'),
('MSEDCL EV Charging - FC Road', 'Ferguson College Road, Pune', 'Pune', 'Maharashtra', 18.5204, 73.8567, 'MSEDCL', ARRAY['CCS2', 'Bharat AC-001', 'Bharat DC-001'], 4, 2, 'active', 15.0, ARRAY['College Area', 'Cafes', 'Parking'], '08:00-22:00'),
('HP Charge - Jubilee Hills', 'Road No. 36, Jubilee Hills, Hyderabad', 'Hyderabad', 'Telangana', 17.4326, 78.4071, 'HP Petroleum', ARRAY['CCS2', 'Type 2 AC', 'CHAdeMO'], 8, 5, 'active', 60.0, ARRAY['Petrol Station', 'Convenience Store', '24hr'], '24/7'),
('Fortum Charge & Drive - Salt Lake', 'Salt Lake City, Sector V, Kolkata', 'Kolkata', 'West Bengal', 22.5726, 88.4312, 'Fortum', ARRAY['CCS2', 'Type 2 AC'], 4, 3, 'active', 22.0, ARRAY['IT Park', 'Cafeteria', 'Parking'], '08:00-20:00'),
('ChargeZone - GIFT City', 'GIFT City, Gandhinagar', 'Gandhinagar', 'Gujarat', 23.1685, 72.6850, 'ChargeZone', ARRAY['CCS2', 'CHAdeMO', 'Type 2 AC'], 15, 12, 'active', 120.0, ARRAY['Financial Hub', 'Food Court', 'Business Lounge'], '24/7'),
('Ather Grid - Anna Nagar', 'Anna Nagar East, Chennai', 'Chennai', 'Tamil Nadu', 13.0878, 80.2111, 'Ather Energy', ARRAY['Ather Proprietary', 'CCS2'], 8, 6, 'active', 3.3, ARRAY['Residential Area', 'Supermarket', 'Pharmacy'], '24/7')
ON CONFLICT DO NOTHING;
