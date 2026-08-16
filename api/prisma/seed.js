import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...\n");

  // Clear existing data in correct order (respecting foreign keys)
  console.log("🧹 Clearing existing data...");
  await prisma.notification.deleteMany();
  await prisma.otpVerification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.chatParticipant.deleteMany();
  await prisma.chat.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.property.deleteMany();
  await prisma.heroBanner.deleteMany();
  await prisma.partner.deleteMany();
  await prisma.service.deleteMany();
  await prisma.testimonial.deleteMany();
  await prisma.faq.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.blogPost.deleteMany();
  await prisma.contactRequest.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.seoSetting.deleteMany();
  await prisma.navItem.deleteMany();
  await prisma.companySettings.deleteMany();
  await prisma.user.deleteMany();
  console.log("✅ Cleared existing data\n");

  // ==================== COMPANY SETTINGS ====================
  console.log("🏢 Creating company settings...");
  await prisma.companySettings.create({
    data: {
      companyName: "Suretreaven",
      companyLogo: "https://images.unsplash.com/photo-1560518883-ce09059eeffa",
      email: "info@odishaland.com",
      phone: "+91 9876543210",
      address: "42 Koel Nagar, Near Rourkela Club",
      city: "Rourkela",
      state: "Odisha",
      pincode: "769014",
      country: "India",
      website: "www.odishaland.com",
      description:
        "Odisha's leading land and property real estate company, providing premium verified properties across Rourkela, Bhubaneswar, Cuttack, Sambalpur, Puri, and Berhampur with transparent pricing and hassle-free booking.",
      whatsappNumber: "919876543210",
      tagline: "Your Trusted Partner for Odisha Real Estate",
      aboutImage: "https://images.unsplash.com/photo-1560518883-ce09059eeffa",
      statsProperties: 350,
      statsCustomers: 1200,
      statsCities: 6,
      statsYears: 12,
      statsProjects: 45,
      youtube: "https://www.youtube.com/@odishalandestate",
      googleMapsEmbed:
        "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d117920.22812837499!2d84.78774085!3d22.2489567!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a201fbb9a501e2b%3A0x3e0e4e1a5e6e1e1e!2sRourkela%2C%20Odisha!5e0!3m2!1sen!2sin!4v1700000000000",
      metaTitle: "Odisha Land Estate - Premium Properties in Rourkela, Bhubaneswar & Odisha",
      metaDescription:
        "Find verified plots, apartments, villas, and commercial properties across Rourkela, Bhubaneswar, Cuttack, Sambalpur, Puri & Berhampur. Odisha's most trusted real estate platform with 12+ years of experience.",
    },
  });
  console.log("✅ Company settings created\n");

  // ==================== HERO BANNERS ====================
  console.log("🖼️  Creating hero banners...");
  const heroBanners = await Promise.all([
    prisma.heroBanner.create({
      data: {
        title: "Find Your Dream Property in Odisha",
        subtitle:
          "Explore premium plots, apartments, and villas across Rourkela, Bhubaneswar, Cuttack and more with transparent pricing.",
        image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa",
        buttonText: "Explore Properties",
        buttonLink: "/list",
        badge: "Trusted by 1200+ Customers",
        highlight: "RERA Approved Properties",
        order: 1,
        isActive: true,
      },
    }),
    prisma.heroBanner.create({
      data: {
        title: "Premium Plots in Rourkela",
        subtitle:
          "Invest in well-connected residential plots in Rourkela's prime localities. Starting from ₹15 Lakhs.",
        image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef",
        buttonText: "View Plots",
        buttonLink: "/list?propertyType=PLOT",
        badge: "Starting ₹15 Lakhs",
        highlight: "Limited Availability",
        order: 2,
        isActive: true,
      },
    }),
    prisma.heroBanner.create({
      data: {
        title: "Luxury Apartments in Bhubaneswar",
        subtitle:
          "Modern 2BHK & 3BHK apartments in Bhubaneswar's top neighborhoods with world-class amenities.",
        image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9",
        buttonText: "View Apartments",
        buttonLink: "/list?propertyType=APARTMENT",
        badge: "New Launch",
        highlight: "Possession in 2025",
        order: 3,
        isActive: true,
      },
    }),
    prisma.heroBanner.create({
      data: {
        title: "Commercial Spaces Across Odisha",
        subtitle:
          "Prime commercial properties on NH-16, railway roads and business hubs of Odisha for offices, shops & showrooms.",
        image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab",
        buttonText: "View Commercial",
        buttonLink: "/list?propertyType=COMMERCIAL",
        badge: "High ROI",
        highlight: "NH-16 Facing Properties",
        order: 4,
        isActive: true,
      },
    }),
  ]);
  console.log(`✅ Created ${heroBanners.length} hero banners\n`);

  // ==================== PARTNERS ====================
  console.log("🤝 Creating partners...");
  const partners = await Promise.all([
    prisma.partner.create({
      data: {
        name: "Rourkela Steel Plant Housing",
        logo: "https://images.unsplash.com/photo-1560518883-ce09059eeffa",
        website: "https://rsp.sail.co.in",
        description: "SAIL's Rourkela Steel Plant housing division providing quality residential solutions for employees and the public.",
        order: 1,
        isActive: true,
      },
    }),
    prisma.partner.create({
      data: {
        name: "Odisha State Housing Board",
        logo: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab",
        website: "https://oshb.odisha.gov.in",
        description: "Government of Odisha housing board developing affordable housing projects across all major cities in Odisha.",
        order: 2,
        isActive: true,
      },
    }),
    prisma.partner.create({
      data: {
        name: "BDA - Bhubaneswar Development Authority",
        logo: "https://images.unsplash.com/photo-1497366216548-37526070297c",
        website: "https://bda.gov.in",
        description: "Bhubaneswar Development Authority planning and developing organized residential and commercial zones in the capital city.",
        order: 3,
        isActive: true,
      },
    }),
    prisma.partner.create({
      data: {
        name: "ICICI Home Finance",
        logo: "https://images.unsplash.com/photo-1554224155-6726b3ff858f",
        website: "https://www.icicihfc.com",
        description: "Leading home finance provider offering competitive interest rates for property purchases across Odisha.",
        order: 4,
        isActive: true,
      },
    }),
    prisma.partner.create({
      data: {
        name: "SBI Home Loans Odisha",
        logo: "https://images.unsplash.com/photo-1554224155-6726b3ff858f",
        website: "https://www.sbi.co.in",
        description: "State Bank of India home loan division with special schemes for Odisha property buyers and NRI investors.",
        order: 5,
        isActive: true,
      },
    }),
    prisma.partner.create({
      data: {
        name: "Rourkela Municipal Corporation",
        logo: "https://images.unsplash.com/photo-1497366216548-37526070297c",
        website: "https://rourkelamc.nic.in",
        description: "Rourkela Municipal Corporation supporting urban development and smart city infrastructure projects.",
        order: 6,
        isActive: true,
      },
    }),
  ]);
  console.log(`✅ Created ${partners.length} partners\n`);

  // ==================== SERVICES ====================
  console.log("🔧 Creating services...");
  const services = await Promise.all([
    prisma.service.create({
      data: {
        title: "Property Verification",
        description: "We provide comprehensive property verification services including title search, encumbrance check, and RERA compliance verification to ensure your investment is secure.",
        icon: "FiCheckCircle",
        order: 1,
        isActive: true,
      },
    }),
    prisma.service.create({
      data: {
        title: "Legal Documentation",
        description: "Our expert lawyers handle all property-related legal documentation including sale agreements, registration, and mutation procedures.",
        icon: "FiFileText",
        order: 2,
        isActive: true,
      },
    }),
    prisma.service.create({
      data: {
        title: "Home Loan Assistance",
        description: "We help you secure the best home loan deals from leading banks with competitive interest rates and flexible repayment options.",
        icon: "FiDollarSign",
        order: 3,
        isActive: true,
      },
    }),
    prisma.service.create({
      data: {
        title: "Property Management",
        description: "Full-service property management including rental income maximization, tenant screening, and maintenance coordination.",
        icon: " FiHome",
        order: 4,
        isActive: true,
      },
    }),
    prisma.service.create({
      data: {
        title: "Interior Design",
        description: "Professional interior design and renovation services to transform your property into a beautiful, functional space.",
        icon: "FiEdit",
        order: 5,
        isActive: true,
      },
    }),
  ]);
  console.log(`✅ Created ${services.length} services\n`);

  // ==================== TESTIMONIALS ====================
  console.log("⭐ Creating testimonials...");
  const testimonials = await Promise.all([
    prisma.testimonial.create({
      data: {
        name: "Praveen Kumar",
        role: "Business Owner",
        company: "Rourkela",
        text: "Odisha Land Estate helped me find the perfect commercial space on NH-16. Their verification team ensured all documents were clear. Highly recommended!",
        rating: 5,
        avatar: "https://i.pravatar.cc/150?img=11",
        order: 1,
        isActive: true,
      },
    }),
    prisma.testimonial.create({
      data: {
        name: "Smita Patel",
        role: "Software Engineer",
        company: "Bhubaneswar",
        text: "As a first-time buyer, I was nervous about the process. The team guided me through every step and helped me get a great home loan.",
        rating: 5,
        avatar: "https://i.pravatar.cc/150?img=5",
        order: 2,
        isActive: true,
      },
    }),
    prisma.testimonial.create({
      data: {
        name: "Ramesh Dash",
        role: "Retired Government Officer",
        company: "Cuttack",
        text: "Invested in a plot in Bhubaneswar through Odisha Land Estate. The returns have been excellent and the process was completely transparent.",
        rating: 5,
        avatar: "https://i.pravatar.cc/150?img=12",
        order: 3,
        isActive: true,
      },
    }),
    prisma.testimonial.create({
      data: {
        name: "Anita Mahanto",
        role: "Doctor",
        company: "Sambalpur",
        text: "Bought my dream home in Rourkela through this platform. The property verification was thorough and the documentation was handled professionally.",
        rating: 4,
        avatar: "https://i.pravatar.cc/150?img=9",
        order: 4,
        isActive: true,
      },
    }),
    prisma.testimonial.create({
      data: {
        name: "Bibhu Prasana",
        role: "NRI Investor",
        company: "USA",
        text: "Living in the US, I was able to purchase property in Odisha through their transparent process. They handled everything remotely with regular updates.",
        rating: 5,
        avatar: "https://i.pravatar.cc/150?img=8",
        order: 5,
        isActive: true,
      },
    }),
  ]);
  console.log(`✅ Created ${testimonials.length} testimonials\n`);

  // ==================== FAQS ====================
  console.log("❓ Creating FAQs...");
  const faqs = await Promise.all([
    prisma.faq.create({
      data: {
        question: "How do I verify a property before purchasing?",
        answer: "We provide comprehensive property verification services including title search, encumbrance certificate, RERA registration check, and legal document review by our expert lawyers.",
        category: "Buying",
        order: 1,
        isActive: true,
      },
    }),
    prisma.faq.create({
      data: {
        question: "What documents are required for property registration?",
        answer: "Required documents include identity proof, address proof, title deeds, no-objection certificates, payment receipts, and passport size photographs. Our team will guide you through the complete process.",
        category: "Legal",
        order: 2,
        isActive: true,
      },
    }),
    prisma.faq.create({
      data: {
        question: "How can I get home loan approval?",
        answer: "We work with leading banks to help you get the best loan offers. Factors affecting approval include credit score, income, property value, and existing liabilities. Apply online or visit our office.",
        category: "Finance",
        order: 3,
        isActive: true,
      },
    }),
    prisma.faq.create({
      data: {
        question: "What is RERA and why is it important?",
        answer: "RERA (Real Estate Regulatory Authority) protects buyers from fraudulent projects. All registered projects must be compliant with RERA guidelines ensuring transparent deals and timely possession.",
        category: "Buying",
        order: 4,
        isActive: true,
      },
    }),
    prisma.faq.create({
      data: {
        question: "How do I calculate return on investment for property?",
        answer: "ROI depends on location, appreciation potential, rental income, and market trends. Our team provides detailed analysis including capital appreciation estimates and rental yield calculations.",
        category: "Investment",
        order: 5,
        isActive: true,
      },
    }),
    prisma.faq.create({
      data: {
        question: "What are the tax benefits of property investment?",
        answer: "Under Section 24, you can claim deduction on home loan interest (up to Rs. 2 lakhs). Under Section 80C, principal repayment offers deduction up to Rs. 1.5 lakhs.",
        category: "Finance",
        order: 6,
        isActive: true,
      },
    }),
  ]);
  console.log(`✅ Created ${faqs.length} FAQs\n`);

  // ==================== TEAM MEMBERS ====================
  console.log("👥 Creating team members...");
  const teamMembers = await Promise.all([
    prisma.teamMember.create({
      data: {
        name: "Soumya Ranjan Nayak",
        designation: "Founder & CEO",
        bio: "Visionary leader with 12+ years in Odisha real estate, establishing trust across 25,000+ clients.",
        avatar: "https://i.pravatar.cc/150?img=33",
        email: "soumya@odishaland.com",
        phone: "+91 9876543210",
        linkedin: "https://linkedin.com",
        order: 1,
        isActive: true,
      },
    }),
    prisma.teamMember.create({
      data: {
        name: "Priyanka Das",
        designation: "Head of Sales",
        bio: "Sales veteran with deep expertise in residential and commercial properties across Odisha.",
        avatar: "https://i.pravatar.cc/150?img=44",
        email: "priyanka@odishaland.com",
        phone: "+91 9876543211",
        linkedin: "https://linkedin.com",
        order: 2,
        isActive: true,
      },
    }),
    prisma.teamMember.create({
      data: {
        name: "Dr. Manoranjan Jena",
        designation: "Legal Consultant",
        bio: "Experienced advocate specializing in property law and RERA matters with 15+ years practice.",
        avatar: "https://i.pravatar.cc/150?img=53",
        email: "manoranjan@odishaland.com",
        phone: "+91 9876543212",
        order: 3,
        isActive: true,
      },
    }),
    prisma.teamMember.create({
      data: {
        name: "Barsha Patnaik",
        designation: "Customer Relations",
        bio: "Dedicated relationship manager ensuring smooth property transactions and client satisfaction.",
        avatar: "https://i.pravatar.cc/150?img=47",
        email: "barsha@odishaland.com",
        phone: "+91 9876543213",
        order: 4,
        isActive: true,
      },
    }),
  ]);
  console.log(`✅ Created ${teamMembers.length} team members\n`);

  // ==================== BLOG POSTS ====================
  console.log("📝 Creating blog posts...");
  const blogPosts = await Promise.all([
    prisma.blogPost.create({
      data: {
        title: "Top 10 Residential Areas in Rourkela 2024",
        slug: "top-10-residential-areas-rourkela-2024",
        excerpt: "Discover the most sought-after residential localities in Rourkela for property investment.",
        content: "<h2>Introduction</h2><p>Rourkela, the steel city of Odisha, offers excellent real estate opportunities. Here are the top 10 residential areas that promise great returns:</p><h3>1. Koel Nagar</h3><p>The most premium locality with excellent connectivity...</p><h3>2. Civil Township</h3><p>Popular among government employees and professionals...</p><h3>3. Sector-22</h3><p>Near shopping mall and schools...</p>",
        category: "Real Estate Tips",
        tags: ["Rourkela", "Residential", "Investment"],
        author: "Odisha Land Estate Team",
        isPublished: true,
        featured: true,
        metaTitle: "Top 10 Residential Areas in Rourkela | Odisha Land Estate",
        metaDescription: "Explore the best residential localities in Rourkela for property investment. Expert analysis of locations, prices, and growth potential.",
      },
    }),
    prisma.blogPost.create({
      data: {
        title: "Complete Guide to RERA Registration in Odisha",
        slug: "complete-guide-rera-registration-odisha",
        excerpt: "Everything you need to know about RERA registration and why it matters for property buyers.",
        content: "<h2>What is RERA?</h2><p>The Real Estate Regulatory Authority (RERA) was established to protect home buyers...</p><h3>Why RERA Matters</h3><p>1. Transparent deals<br/>2. Timely possession<br/>3. Quality assurance...</p>",
        category: "Legal Guide",
        tags: ["RERA", "Legal", "Buyer Guide"],
        author: "Dr. Manoranjan Jena",
        isPublished: true,
        featured: true,
        metaTitle: "Complete RERA Guide Odisha | Property Buyer Guide",
        metaDescription: "Learn about RERA registration process in Odisha and how it protects property buyers.",
      },
    }),
    prisma.blogPost.create({
      data: {
        title: "Home Loan vs Plot Loan: Which One Should You Choose?",
        slug: "home-loan-vs-plot-loan-odisha",
        excerpt: "Comparing home loans and plot loans to help you make the right financial decision.",
        content: "<h2>Understanding Your Options</h2><p>When buying property in Odisha, understanding the right loan type is crucial...</p><h3>Home Loan Benefits</h3><p>1. Lower interest rates<br/>2. Tax benefits under Section 24...</p><h3>Plot Loan Considerations</h3><p>Plot loans typically have higher interest rates...</p>",
        category: "Finance",
        tags: ["Home Loan", "Finance", "Investment"],
        author: "Finance Team",
        isPublished: true,
        featured: false,
        metaTitle: "Home Loan vs Plot Loan Odisha | Expert Guidance",
        metaDescription: "Compare home loans and plot loans in Odisha to make informed financial decisions.",
      },
    }),
    prisma.blogPost.create({
      data: {
        title: "Bhubaneswar Real Estate: Investment Hotspots 2024",
        slug: "bhubaneswar-real-estate-investment-hotspots-2024",
        excerpt: "Explore the emerging real estate hotspots in Bhubaneswar with high appreciation potential.",
        content: "<h2>Capital City's Growth Story</h2><p>Bhubaneswar, the capital of Odisha, is witnessing rapid real estate growth...</p><h3>Key Investment Areas</h3><p>1. Patia - IT hub proximity<br/>2. Chandrasekharpur - Educational institutions<br/>3. Khandagiri - Shopping and amenities...</p>",
        category: "Investment",
        tags: ["Bhubaneswar", "Investment", "Hotspot"],
        author: "Investment Team",
        isPublished: true,
        featured: true,
        metaTitle: "Bhubaneswar Investment Hotspots 2024 | Odisha Land Estate",
        metaDescription: "Discover the best investment opportunities in Bhubaneswar real estate market.",
      },
    }),
    prisma.blogPost.create({
      data: {
        title: "5 Common Mistakes to Avoid When Buying Property",
        slug: "5-common-mistakes-buying-property-odisha",
        excerpt: "Expert tips on avoiding costly mistakes when purchasing your dream property.",
        content: "<h2>Avoid These Costly Mistakes</h2><p>Buying property is a big decision. Here are 5 common mistakes to avoid:</p><h3>1. Skipping Property Verification</h3><p>Always verify title documents and RERA registration...</p><h3>2.Ignoring Hidden Costs</h3><p>Registration fees, stamp duty, and legal charges add up...</p><h3>3. Not Comparing Options</h3><p>Research multiple properties before deciding...</p>",
        category: "Buyer Guide",
        tags: ["Buyer Guide", "Tips", "Mistakes"],
        author: "Customer Relations",
        isPublished: true,
        featured: false,
        metaTitle: "5 Mistakes to Avoid When Buying Property | Odisha Land Estate",
        metaDescription: "Expert tips on avoiding common mistakes when buying property in Odisha.",
      },
    }),
  ]);
  console.log(`✅ Created ${blogPosts.length} blog posts\n`);

  // ==================== LEADS ====================
  console.log("🎯 Creating leads...");
  const leads = await Promise.all([
    prisma.lead.create({
      data: {
        name: "Amit Kumar Sahoo",
        email: "amit.sahoo@email.com",
        phone: "9437123456",
        source: "WEBSITE",
        status: "NEW",
        propertyTitle: "2BHK Apartment in Bhubaneswar",
        notes: "Looking for flat under 40 lakhs near Patia",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.lead.create({
      data: {
        name: "Priya Dash",
        email: "priya.dash@email.com",
        phone: "9438123456",
        source: "SOCIAL_MEDIA",
        status: "CONTACTED",
        propertyTitle: "Residential Plot in Rourkela",
        notes: "Interested in Koel Nagar area, budget 25 lakhs",
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.lead.create({
      data: {
        name: "Rajesh Mohanty",
        email: "rajesh.m@email.com",
        phone: "9439123456",
        source: "REFERRAL",
        status: "QUALIFIED",
        propertyTitle: "Commercial Space in Cuttack",
        notes: "Wants shop in central Cuttack, budget 50 lakhs",
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.lead.create({
      data: {
        name: "Sunita Pradhan",
        email: "sunita.p@email.com",
        phone: "9440123456",
        source: "WEBSITE",
        status: "NEW",
        propertyTitle: "3BHK Flat in Puri",
        notes: "Looking for sea view apartment, budget 35 lakhs",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.lead.create({
      data: {
        name: "Bibhu Nanda",
        email: "bibhu.n@email.com",
        phone: "9441123456",
        source: "WEBSITE",
        status: "LOST",
        propertyTitle: "Plot in Sambalpur",
        notes: "Budget constraints, not ready to proceed now",
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.lead.create({
      data: {
        name: "Lisa Mahanto",
        email: "lisa.m@email.com",
        phone: "9442123456",
        source: "SOCIAL_MEDIA",
        status: "CONVERTED",
        propertyTitle: "Villa in Rourkela",
        notes: "Purchased villa in Koel Nagar - 85 lakhs",
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);
  console.log(`✅ Created ${leads.length} leads\n`);

  // ==================== CONTACT REQUESTS ====================
  console.log("📧 Creating contact requests...");
  const contactRequests = await Promise.all([
    prisma.contactRequest.create({
      data: {
        name: "Kunal Singh",
        email: "kunal.singh@email.com",
        phone: "9456123456",
        subject: "Inquiry about Rourkela plots",
        message: "Hi, I'm interested in residential plots in Rourkela. Please share available options under 30 lakhs.",
        isRead: false,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.contactRequest.create({
      data: {
        name: "Meera Das",
        email: "meera.das@email.com",
        phone: "9457123456",
        subject: "Home loan assistance",
        message: "Need help with home loan for 2BHK apartment in Bhubaneswar. Salary - 75k/month.",
        isRead: true,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.contactRequest.create({
      data: {
        name: "Suresh Behera",
        email: "suresh.b@email.com",
        phone: "9458123456",
        subject: "Commercial property inquiry",
        message: "Looking for commercial space for clinic in Cuttack. Area around 800 sqft.",
        isRead: false,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.contactRequest.create({
      data: {
        name: "Anuja Kar",
        email: "anuja.kar@email.com",
        phone: "9459123456",
        subject: "Property verification service",
        message: "Want to verify a property in Puri before booking. How does your verification service work?",
        isRead: true,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);
  console.log(`✅ Created ${contactRequests.length} contact requests\n`);

  // ==================== SEO SETTINGS ====================
  console.log("🔍 Creating SEO settings...");
  const seoSettings = await Promise.all([
    prisma.seoSetting.upsert({
      where: { page: "home" },
      update: {},
      create: {
        page: "home",
        metaTitle: "Odisha Land Estate | Premium Properties in Rourkela, Bhubaneswar & Odisha",
        metaDescription: "Find verified plots, apartments, villas & commercial properties across Odisha. Odisha's most trusted real estate platform with 12+ years experience.",
        metaKeywords: "real estate Odisha, property Rourkela, property Bhubaneswar, plots for sale Odisha, apartments Bhubaneswar",
      },
    }),
    prisma.seoSetting.upsert({
      where: { page: "properties" },
      update: {},
      create: {
        page: "properties",
        metaTitle: "Property in Odisha | Apartments, Plots & Villas for Sale",
        metaDescription: "Browse verified properties in Rourkela, Bhubaneswar, Cuttack & more. Filters for price, location, property type.",
        metaKeywords: "property for sale Odisha, apartments for sale,.plot for sale",
      },
    }),
    prisma.seoSetting.upsert({
      where: { page: "blog" },
      update: {},
      create: {
        page: "blog",
        metaTitle: "Real Estate Blog | Odisha Property Insights",
        metaDescription: "Expert insights on Odisha real estate, property buying tips, investment guides and market trends.",
        metaKeywords: "real estate blog Odisha, property tips, investment guide",
      },
    }),
    prisma.seoSetting.upsert({
      where: { page: "contact" },
      update: {},
      create: {
        page: "contact",
        metaTitle: "Contact Us | Odisha Land Estate",
        metaDescription: "Get in touch with Odisha's top real estate experts. Visit our office or call us today.",
        metaKeywords: "contact real estate Odisha",
      },
    }),
  ]);
  console.log(`✅ Created ${seoSettings.length} SEO settings\n`);

  // ==================== NAVIGATION ====================
  console.log("🧭 Creating navigation items...");
  const navItems = await Promise.all([
    { location: "HEADER", label: "Home", url: "/", order: 1 },
    { location: "HEADER", label: "Properties", url: "/list", order: 2 },
    { location: "HEADER", label: "Explore", url: "/explore", order: 3 },
    { location: "HEADER", label: "About", url: "/about", order: 4 },
    { location: "HEADER", label: "Contact", url: "/contact", order: 5 },
    { location: "HEADER", label: "Blog", url: "/blog", order: 6 },
    { location: "HEADER", label: "FAQ", url: "/faq", order: 7 },
    { location: "FOOTER", label: "Home", url: "/", order: 1 },
    { location: "FOOTER", label: "Properties", url: "/list", order: 2 },
    { location: "FOOTER", label: "About Us", url: "/about", order: 3 },
    { location: "FOOTER", label: "Contact Us", url: "/contact", order: 4 },
    { location: "FOOTER", label: "Blog", url: "/blog", order: 5 },
    { location: "FOOTER", label: "FAQ", url: "/faq", order: 6 },
    { location: "FOOTER", label: "Privacy Policy", url: "/privacy", order: 7 },
    { location: "FOOTER", label: "Terms & Conditions", url: "/terms", order: 8 },
  ].map((item) => prisma.navItem.create({ data: item })));
  console.log(`✅ Created ${navItems.length} navigation items\n`);

  // ==================== USERS ====================
  console.log("👥 Creating users...");
  const hashedPassword = await bcrypt.hash("password123", 10);

  // Create admin users (3)
  const admins = await Promise.all([
    prisma.user.create({
      data: {
        username: "admin",
        email: "soumya050794@gmail.com",
        password: hashedPassword,
        role: "ADMIN",
        isEmailVerified: true,
        canAccessAdminPanel: true,
        passwordLoginEnabled: true,
        avatar: "https://i.pravatar.cc/150?img=1",
        phone: "+91 9876543210",
      },
    }),
    prisma.user.create({
      data: {
        username: "admin_manager",
        email: "manager@odishaland.com",
        password: hashedPassword,
        role: "ADMIN",
        isEmailVerified: true,
        canAccessAdminPanel: true,
        passwordLoginEnabled: true,
        avatar: "https://i.pravatar.cc/150?img=2",
        phone: "+91 9876543220",
      },
    }),
    prisma.user.create({
      data: {
        username: "admin_support",
        email: "support@odishaland.com",
        password: hashedPassword,
        role: "ADMIN",
        isEmailVerified: true,
        canAccessAdminPanel: true,
        passwordLoginEnabled: true,
        avatar: "https://i.pravatar.cc/150?img=3",
        phone: "+91 9876543230",
      },
    }),
  ]);

  // Create staff users (5)
  const staffMembers = await Promise.all([
    prisma.user.create({
      data: {
        username: "staff_sales1",
        email: "sales1@odishaland.com",
        password: hashedPassword,
        role: "STAFF",
        isEmailVerified: true,
        canAccessAdminPanel: true,
        passwordLoginEnabled: true,
        permissions: ["ADMIN_PANEL", "MANAGE_PROPERTIES", "MANAGE_BOOKINGS", "MANAGE_LEADS"],
        avatar: "https://i.pravatar.cc/150?img=10",
        phone: "+91 9876543241",
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        username: "staff_sales2",
        email: "sales2@odishaland.com",
        password: hashedPassword,
        role: "STAFF",
        isEmailVerified: true,
        canAccessAdminPanel: true,
        passwordLoginEnabled: true,
        permissions: ["ADMIN_PANEL", "MANAGE_PROPERTIES", "MANAGE_BOOKINGS"],
        avatar: "https://i.pravatar.cc/150?img=11",
        phone: "+91 9876543242",
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        username: "staff_support",
        email: "support1@odishaland.com",
        password: hashedPassword,
        role: "STAFF",
        isEmailVerified: true,
        canAccessAdminPanel: true,
        passwordLoginEnabled: true,
        permissions: ["ADMIN_PANEL", "MANAGE_USERS", "VIEW_ANALYTICS"],
        avatar: "https://i.pravatar.cc/150?img=15",
        phone: "+91 9876543243",
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        username: "staff_cms",
        email: "cms@odishaland.com",
        password: hashedPassword,
        role: "STAFF",
        isEmailVerified: true,
        canAccessAdminPanel: true,
        passwordLoginEnabled: true,
        permissions: ["ADMIN_PANEL", "MANAGE_CMS"],
        avatar: "https://i.pravatar.cc/150?img=20",
        phone: "+91 9876543244",
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        username: "staff_inactive",
        email: "inactive@odishaland.com",
        password: hashedPassword,
        role: "STAFF",
        isEmailVerified: true,
        canAccessAdminPanel: false,
        passwordLoginEnabled: false,
        permissions: [],
        avatar: "https://i.pravatar.cc/150?img=30",
        phone: "+91 9876543245",
        isActive: false,
      },
    }),
  ]);
  console.log(`✅ Created ${admins.length} admins and ${staffMembers.length} staff\n`);

  // Create regular users (20+)
  const userDataList = [
    { username: "suresh_mohapatra", email: "suresh@example.com", phone: "+91 9876543211", avatar: 12 },
    { username: "anita_das", email: "anita@example.com", phone: "+91 9876543212", avatar: 25 },
    { username: "rahul_padhan", email: "rahul@example.com", phone: "+91 9876543213", avatar: 33 },
    { username: "priya_mishra", email: "priya@example.com", phone: "+91 9876543214", avatar: 45 },
    { username: "amit_sahoo", email: "amit@example.com", phone: "+91 9876543215", avatar: 58 },
    { username: "sneha_behera", email: "sneha@example.com", phone: "+91 9876543216", avatar: 60 },
    { username: "vikram_singh", email: "vikram@example.com", phone: "+91 9876543217", avatar: 61 },
    { username: "anita_pati", email: "anita.p@example.com", phone: "+91 9876543218", avatar: 62 },
    { username: "kartik_naik", email: "kartik@example.com", phone: "+91 9876543219", avatar: 63 },
    { username: "meera_rath", email: "meera@example.com", phone: "+91 9876543220", avatar: 64 },
    { username: "arjun_mehta", email: "arjun@example.com", phone: "+91 9876543221", avatar: 65 },
    { username: "divya_panda", email: "divya@example.com", phone: "+91 9876543222", avatar: 66 },
    { username: "rohit_samal", email: "rohit@example.com", phone: "+91 9876543223", avatar: 67 },
    { username: "pooja_dash", email: "pooja@example.com", phone: "+91 9876543224", avatar: 68 },
    { username: "arun_khandual", email: "arun@example.com", phone: "+91 9876543225", avatar: 69 },
    { username: "nisha_mahapatra", email: "nisha@example.com", phone: "+91 9876543226", avatar: 70 },
    { username: "sanjay_tripathy", email: "sanjay@example.com", phone: "+91 9876543227", avatar: 71 },
    { username: "kavita_swain", email: "kavita@example.com", phone: "+91 9876543228", avatar: 72 },
    { username: "manish_bhol", email: "manish@example.com", phone: "+91 9876543229", avatar: 73 },
    { username: "ritu_agarwal", email: "ritu@example.com", phone: "+91 9876543230", avatar: 74 },
  ];

  const users = await Promise.all(
    userDataList.map(userData =>
      prisma.user.create({
        data: {
          username: userData.username,
          email: userData.email,
          password: hashedPassword,
          role: "USER",
          avatar: `https://i.pravatar.cc/150?img=${userData.avatar}`,
          phone: userData.phone,
        },
      })
    )
  );

  console.log(`✅ Created ${admins.length} admins and ${users.length} users\n`);

  // ==================== PROPERTIES ====================
  console.log("🏘️  Creating properties...");
  
  const propertyDataList = [
    // Rourkela Properties (8)
    {
      title: "Premium Residential Plot in Koel Nagar",
      description: "1200 sq.ft residential plot in prime location of Koel Nagar. Clear title, ready for construction with all modern amenities nearby. Close to Rourkela Club and Sector markets.",
      price: 2500000,
      tokenAmount: 50000,
      images: ["https://images.unsplash.com/photo-1500382017468-9049fed747ef", "https://images.unsplash.com/photo-1513584684374-8bab748fbf90"],
      address: "Plot No. 45, Koel Nagar",
      city: "Rourkela",
      state: "Odisha",
      pincode: "769014",
      latitude: "22.2489",
      longitude: "84.8877",
      propertyType: "PLOT",
      saleType: "SALE",
      status: "AVAILABLE",
      bedroom: 0,
      bathroom: 0,
      area: 1200,
      amenities: ["Gated Community", "24/7 Security", "Water Supply", "Street Lights"],
      features: ["Corner Plot", "Clear Title", "RERA Approved"],
    },
    {
      title: "Luxury 3BHK Apartment in Sector-2",
      description: "Spacious 1500 sq.ft apartment with modern amenities and excellent connectivity to RSP township and IGH Hospital.",
      price: 5500000,
      tokenAmount: 100000,
      images: ["https://images.unsplash.com/photo-1568605114967-8130f3a36994", "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688"],
      address: "Skyline Residency, Sector-2",
      city: "Rourkela",
      state: "Odisha",
      pincode: "769006",
      latitude: "22.2317",
      longitude: "84.8563",
      propertyType: "APARTMENT",
      saleType: "SALE",
      status: "AVAILABLE",
      bedroom: 3,
      bathroom: 2,
      area: 1500,
      amenities: ["Swimming Pool", "Gym", "24/7 Security", "Clubhouse", "Parking"],
      features: ["Ready to Move", "Vastu Compliant", "Modular Kitchen"],
    },
    {
      title: "Commercial Land on NH-143, Rourkela",
      description: "2500 sq.ft commercial plot with excellent highway visibility and high foot traffic near Birmitrapur junction.",
      price: 8000000,
      tokenAmount: 200000,
      images: ["https://images.unsplash.com/photo-1486406146926-c627a92ad1ab", "https://images.unsplash.com/photo-1497366216548-37526070297c"],
      address: "Survey No. 123, NH-143, Birmitrapur Road",
      city: "Rourkela",
      state: "Odisha",
      pincode: "770033",
      latitude: "22.4025",
      longitude: "84.7634",
      propertyType: "COMMERCIAL",
      saleType: "SALE",
      status: "AVAILABLE",
      bedroom: 0,
      bathroom: 0,
      area: 2500,
      amenities: ["Highway Access", "Parking Space", "High Visibility"],
      features: ["Corner Plot", "Commercial Zone", "Wide Road"],
    },
    {
      title: "2BHK Villa in Civil Township",
      description: "Beautiful villa with garden space and modern amenities in the peaceful Civil Township area near IGH.",
      price: 4500000,
      tokenAmount: 100000,
      images: ["https://images.unsplash.com/photo-1580587771525-78b9dba3b914", "https://images.unsplash.com/photo-1564013799919-ab600027ffc6"],
      address: "Green Valley Villas, Civil Township",
      city: "Rourkela",
      state: "Odisha",
      pincode: "769004",
      latitude: "22.2520",
      longitude: "84.8732",
      propertyType: "VILLA",
      saleType: "SALE",
      status: "TOKEN_BOOKED",
      bedroom: 2,
      bathroom: 2,
      area: 1800,
      amenities: ["Garden", "Parking", "24/7 Security", "Water Harvesting"],
      features: ["Duplex", "Private Garden", "Solar Panels"],
    },
    {
      title: "1BHK Apartment for Rent in Chhend Colony",
      description: "Compact and affordable 1BHK apartment near RSP plant gate with good transport connectivity.",
      price: 8000,
      tokenAmount: 16000,
      images: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2", "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267"],
      address: "Chhend Colony, Near Plant Gate",
      city: "Rourkela",
      state: "Odisha",
      pincode: "769011",
      latitude: "22.2217",
      longitude: "84.8545",
      propertyType: "APARTMENT",
      saleType: "RENT",
      status: "AVAILABLE",
      bedroom: 1,
      bathroom: 1,
      area: 650,
      amenities: ["Security", "Power Backup", "Parking", "Water Supply"],
      features: ["Semi-Furnished", "Near RSP", "Bus Stop Nearby"],
    },
    {
      title: "Agricultural Land in Rourkela Outskirts",
      description: "5 acres agricultural land with water source from Brahmani river, perfect for farming and long-term investment.",
      price: 3500000,
      tokenAmount: 100000,
      images: ["https://images.unsplash.com/photo-1500382017468-9049fed747ef", "https://images.unsplash.com/photo-1625246333195-78d9c38ad449"],
      address: "Village Road, Near Brahmani River",
      city: "Rourkela",
      state: "Odisha",
      pincode: "770036",
      latitude: "22.1900",
      longitude: "84.9200",
      propertyType: "PLOT",
      saleType: "SALE",
      status: "AVAILABLE",
      bedroom: 0,
      bathroom: 0,
      area: 217800,
      amenities: ["Water Source", "Road Access", "Electricity"],
      features: ["Agricultural Land", "Fertile Soil", "River Proximity"],
    },
    {
      title: "Penthouse in Sector-14, Rourkela",
      description: "Luxurious penthouse with terrace garden and panoramic views of the Rourkela skyline and surrounding hills.",
      price: 12000000,
      tokenAmount: 300000,
      images: ["https://images.unsplash.com/photo-1613490493576-7fde63acd811", "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9"],
      address: "The Penthouses, Sector-14",
      city: "Rourkela",
      state: "Odisha",
      pincode: "769014",
      latitude: "22.2567",
      longitude: "84.8912",
      propertyType: "APARTMENT",
      saleType: "SALE",
      status: "AVAILABLE",
      bedroom: 4,
      bathroom: 4,
      area: 3500,
      amenities: ["Private Lift", "Terrace Garden", "Swimming Pool", "Concierge"],
      features: ["Luxury Interiors", "Smart Home", "Private Terrace"],
    },
    {
      title: "Office Space in Udit Nagar, Rourkela",
      description: "Modern office space in Udit Nagar commercial area with all amenities and excellent road connectivity.",
      price: 25000,
      tokenAmount: 50000,
      images: ["https://images.unsplash.com/photo-1497366216548-37526070297c", "https://images.unsplash.com/photo-1497366754035-f200581a8d95"],
      address: "Udit Nagar Commercial Complex",
      city: "Rourkela",
      state: "Odisha",
      pincode: "769012",
      latitude: "22.2298",
      longitude: "84.8489",
      propertyType: "COMMERCIAL",
      saleType: "RENT",
      status: "RENTED",
      bedroom: 0,
      bathroom: 2,
      area: 2000,
      amenities: ["Parking", "Cafeteria", "24/7 Access", "Power Backup"],
      features: ["Furnished", "Main Road", "Meeting Rooms"],
    },
    
    // Bhubaneswar Properties (6)
    {
      title: "4BHK Sea-View Apartment in Puri Road, Bhubaneswar",
      description: "Luxurious apartment with breathtaking views along the Puri-Konark marine drive approach. World-class amenities in Patia area.",
      price: 18000000,
      tokenAmount: 500000,
      images: ["https://images.unsplash.com/photo-1600607687939-ce8a6c25118c", "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9"],
      address: "Ocean View Apartments, Patia",
      city: "Bhubaneswar",
      state: "Odisha",
      pincode: "751024",
      latitude: "20.3528",
      longitude: "85.8181",
      propertyType: "APARTMENT",
      saleType: "SALE",
      status: "TOKEN_BOOKED",
      bedroom: 4,
      bathroom: 3,
      area: 2500,
      amenities: ["Swimming Pool", "Gym", "Spa", "Concierge", "Clubhouse"],
      features: ["Luxury Living", "Smart Home", "Imported Fittings"],
    },
    {
      title: "2BHK Apartment for Rent in Saheed Nagar",
      description: "Well-maintained 900 sq.ft apartment in prime Saheed Nagar location near railway station.",
      price: 18000,
      tokenAmount: 36000,
      images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267", "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2"],
      address: "Saheed Nagar, Near Railway Station",
      city: "Bhubaneswar",
      state: "Odisha",
      pincode: "751007",
      latitude: "20.2642",
      longitude: "85.8420",
      propertyType: "APARTMENT",
      saleType: "RENT",
      status: "AVAILABLE",
      bedroom: 2,
      bathroom: 1,
      area: 900,
      amenities: ["Gym", "Parking", "24/7 Security", "Power Backup"],
      features: ["Near Station", "Semi-Furnished", "Good Connectivity"],
    },
    {
      title: "Commercial Shop in Unit-3 Market, Bhubaneswar",
      description: "Prime retail space in bustling Unit-3 market area, one of Bhubaneswar's oldest commercial hubs.",
      price: 12000000,
      tokenAmount: 300000,
      images: ["https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d", "https://images.unsplash.com/photo-1541888946425-d81bb19240f5"],
      address: "Unit-3 Market Building, Bhubaneswar",
      city: "Bhubaneswar",
      state: "Odisha",
      pincode: "751001",
      latitude: "20.2598",
      longitude: "85.8385",
      propertyType: "COMMERCIAL",
      saleType: "SALE",
      status: "AVAILABLE",
      bedroom: 0,
      bathroom: 1,
      area: 800,
      amenities: ["Prime Location", "High Footfall", "Parking Nearby"],
      features: ["Corner Shop", "Main Road Facing", "Ready to Occupy"],
    },
    {
      title: "1BHK in KIIT Area, Patia",
      description: "Affordable apartment near KIIT University with excellent student and IT professional demand.",
      price: 3200000,
      tokenAmount: 64000,
      images: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2", "https://images.unsplash.com/photo-1565953522043-baea26b83b7e"],
      address: "KIIT Residency, Patia",
      city: "Bhubaneswar",
      state: "Odisha",
      pincode: "751024",
      latitude: "20.3528",
      longitude: "85.8181",
      propertyType: "APARTMENT",
      saleType: "SALE",
      status: "SOLD",
      bedroom: 1,
      bathroom: 1,
      area: 550,
      amenities: ["Garden", "Gym", "Children's Play Area", "Security"],
      features: ["Park Facing", "Well Ventilated", "Near IT Hub"],
    },
    {
      title: "Luxury Villa in Chandrasekharpur",
      description: "Sprawling villa in the prestigious Chandrasekharpur area with landscaped gardens and modern interiors.",
      price: 45000000,
      tokenAmount: 1000000,
      images: ["https://images.unsplash.com/photo-1613490493576-7fde63acd811", "https://images.unsplash.com/photo-1512917774080-9991f1c4c750"],
      address: "Chandrasekharpur VIP Road",
      city: "Bhubaneswar",
      state: "Odisha",
      pincode: "751016",
      latitude: "20.3090",
      longitude: "85.8180",
      propertyType: "VILLA",
      saleType: "SALE",
      status: "AVAILABLE",
      bedroom: 6,
      bathroom: 7,
      area: 8000,
      amenities: ["Private Pool", "Home Theater", "Gym", "Staff Quarters", "Garden"],
      features: ["VIP Area", "Private Garden", "Heritage Design"],
    },
    {
      title: "Studio Apartment in Infocity, Bhubaneswar",
      description: "Compact studio perfect for IT professionals working in Infocity and Patia IT parks.",
      price: 12000,
      tokenAmount: 24000,
      images: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688", "https://images.unsplash.com/photo-1540932239986-30128078f3c5"],
      address: "Infocity Towers, Patia",
      city: "Bhubaneswar",
      state: "Odisha",
      pincode: "751024",
      latitude: "20.3480",
      longitude: "85.8100",
      propertyType: "APARTMENT",
      saleType: "RENT",
      status: "AVAILABLE",
      bedroom: 0,
      bathroom: 1,
      area: 400,
      amenities: ["Gym", "24/7 Security", "Furnished", "Power Backup"],
      features: ["Fully Furnished", "IT Park Nearby", "Ready to Move"],
    },
    
    // Cuttack Properties (4)
    {
      title: "3BHK Apartment in CDA Sector-7",
      description: "Modern apartment in Cuttack's well-planned CDA area with excellent amenities and connectivity to Bhubaneswar.",
      price: 6500000,
      tokenAmount: 130000,
      images: ["https://images.unsplash.com/photo-1545324418-cc1a3fa10c00", "https://images.unsplash.com/photo-1512917774080-9991f1c4c750"],
      address: "CDA Sector-7, Cuttack",
      city: "Cuttack",
      state: "Odisha",
      pincode: "753014",
      latitude: "20.4750",
      longitude: "85.8700",
      propertyType: "APARTMENT",
      saleType: "SALE",
      status: "AVAILABLE",
      bedroom: 3,
      bathroom: 3,
      area: 1800,
      amenities: ["Swimming Pool", "Tennis Court", "Gym", "Clubhouse", "24/7 Security"],
      features: ["Gated Community", "Premium Amenities", "Near NH-16"],
    },
    {
      title: "Commercial Office near SCB Medical",
      description: "Ready-to-move office space near SCB Medical College with high commercial potential and foot traffic.",
      price: 30000,
      tokenAmount: 60000,
      images: ["https://images.unsplash.com/photo-1497366216548-37526070297c", "https://images.unsplash.com/photo-1524634126442-357e0eac3c14"],
      address: "SCB Medical Road, Mangalabag",
      city: "Cuttack",
      state: "Odisha",
      pincode: "753007",
      latitude: "20.4625",
      longitude: "85.8830",
      propertyType: "COMMERCIAL",
      saleType: "RENT",
      status: "AVAILABLE",
      bedroom: 0,
      bathroom: 2,
      area: 1500,
      amenities: ["Parking", "Food Court Nearby", "24/7 Security", "Power Backup"],
      features: ["Medical Hub", "Main Road", "High Visibility"],
    },
    {
      title: "2BHK in Buxi Bazaar, Cuttack",
      description: "Heritage area apartment in the heart of Cuttack's famous silver filigree market neighborhood.",
      price: 4200000,
      tokenAmount: 84000,
      images: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2", "https://images.unsplash.com/photo-1555636222-cae831e670b3"],
      address: "Buxi Bazaar, Near Chandi Temple",
      city: "Cuttack",
      state: "Odisha",
      pincode: "753001",
      latitude: "20.4621",
      longitude: "85.8815",
      propertyType: "APARTMENT",
      saleType: "SALE",
      status: "TOKEN_BOOKED",
      bedroom: 2,
      bathroom: 2,
      area: 1200,
      amenities: ["Rooftop Garden", "Gym", "Party Hall", "Security"],
      features: ["Heritage Area", "Market Nearby", "Modern Design"],
    },
    {
      title: "Residential Plot in Trishulia",
      description: "Residential plot in Cuttack-Bhubaneswar border area with great appreciation potential as the twin cities expand.",
      price: 3000000,
      tokenAmount: 60000,
      images: ["https://images.unsplash.com/photo-1500382017468-9049fed747ef", "https://images.unsplash.com/photo-1448630360428-65456885c650"],
      address: "Trishulia, Cuttack-Bhubaneswar Highway",
      city: "Cuttack",
      state: "Odisha",
      pincode: "754005",
      latitude: "20.5200",
      longitude: "85.8500",
      propertyType: "PLOT",
      saleType: "SALE",
      status: "AVAILABLE",
      bedroom: 0,
      bathroom: 0,
      area: 2400,
      amenities: ["Gated Layout", "Underground Drainage", "Wide Roads", "Parks"],
      features: ["ODA Approved", "Clear Title", "Good Investment"],
    },
    
    // Sambalpur Properties (3)
    {
      title: "3BHK Apartment in Budharaja, Sambalpur",
      description: "Spacious apartment in Budharaja area with views of Hirakud Dam approach and Mahanadi river.",
      price: 4800000,
      tokenAmount: 96000,
      images: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688", "https://images.unsplash.com/photo-1560185007-5f0bb1866cab"],
      address: "Budharaja Hill View, Sambalpur",
      city: "Sambalpur",
      state: "Odisha",
      pincode: "768001",
      latitude: "21.4669",
      longitude: "83.9756",
      propertyType: "APARTMENT",
      saleType: "SALE",
      status: "SOLD",
      bedroom: 3,
      bathroom: 2,
      area: 1650,
      amenities: ["Clubhouse", "Swimming Pool", "Gym", "Parking", "24/7 Security"],
      features: ["Hill View", "Ready to Move", "Good Society"],
    },
    {
      title: "Commercial Space in VSS Marg, Sambalpur",
      description: "Prime commercial property on VSS Marg, the main commercial road of Sambalpur near the medical college.",
      price: 20000,
      tokenAmount: 40000,
      images: ["https://images.unsplash.com/photo-1497366216548-37526070297c", "https://images.unsplash.com/photo-1565043666747-69f6646db940"],
      address: "VSS Marg, Near VSS Medical College",
      city: "Sambalpur",
      state: "Odisha",
      pincode: "768001",
      latitude: "21.4710",
      longitude: "83.9800",
      propertyType: "COMMERCIAL",
      saleType: "RENT",
      status: "AVAILABLE",
      bedroom: 0,
      bathroom: 2,
      area: 3000,
      amenities: ["Central Location", "Parking", "Power Backup"],
      features: ["Prime Location", "High Footfall", "Medical Area"],
    },
    {
      title: "Farmhouse near Hirakud Dam",
      description: "Sprawling farmhouse with lush gardens near the world's longest earthen dam. Perfect for weekend getaways and agri-tourism.",
      price: 25000000,
      tokenAmount: 500000,
      images: ["https://images.unsplash.com/photo-1580587771525-78b9dba3b914", "https://images.unsplash.com/photo-1449844908441-8829872d2607"],
      address: "Hirakud Dam Road, Sambalpur",
      city: "Sambalpur",
      state: "Odisha",
      pincode: "768016",
      latitude: "21.5167",
      longitude: "83.8800",
      propertyType: "VILLA",
      saleType: "SALE",
      status: "AVAILABLE",
      bedroom: 5,
      bathroom: 5,
      area: 12000,
      amenities: ["Swimming Pool", "Lawn", "Guest House", "Servant Quarters", "Garden"],
      features: ["Dam View", "Party Venue", "Weekend Home"],
    },

    // Puri Properties (2)
    {
      title: "Sea-Facing 3BHK near Golden Beach, Puri",
      description: "Luxurious sea-facing apartment with breathtaking Bay of Bengal views, walking distance from the Jagannath Temple.",
      price: 9500000,
      tokenAmount: 200000,
      images: ["https://images.unsplash.com/photo-1600607687939-ce8a6c25118c", "https://images.unsplash.com/photo-1600607687644-c7171b42498b"],
      address: "Marine Drive Road, Near Golden Beach",
      city: "Puri",
      state: "Odisha",
      pincode: "752001",
      latitude: "19.8135",
      longitude: "85.8312",
      propertyType: "APARTMENT",
      saleType: "SALE",
      status: "AVAILABLE",
      bedroom: 3,
      bathroom: 3,
      area: 1800,
      amenities: ["Sea View", "Swimming Pool", "Gym", "Temple Nearby", "Concierge"],
      features: ["Beach Facing", "Temple Proximity", "Designer Interiors"],
    },
    {
      title: "Plot near Puri-Konark Marine Drive",
      description: "Premium residential plot near the upcoming Puri-Konark marine drive extension with excellent tourism and investment potential.",
      price: 4000000,
      tokenAmount: 80000,
      images: ["https://images.unsplash.com/photo-1500382017468-9049fed747ef", "https://images.unsplash.com/photo-1448630360428-65456885c650"],
      address: "Puri-Konark Marine Drive Road",
      city: "Puri",
      state: "Odisha",
      pincode: "752002",
      latitude: "19.8700",
      longitude: "85.8600",
      propertyType: "PLOT",
      saleType: "SALE",
      status: "AVAILABLE",
      bedroom: 0,
      bathroom: 0,
      area: 2000,
      amenities: ["Road Access", "Electricity", "Water Supply"],
      features: ["Marine Drive Facing", "Tourism Zone", "Investment Hotspot"],
    },

    // Berhampur Properties (2)
    {
      title: "2BHK Apartment in Gosaninuagaon, Berhampur",
      description: "Well-located apartment in Berhampur's prime residential area near MKCG Medical College.",
      price: 3500000,
      tokenAmount: 70000,
      images: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2", "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688"],
      address: "Gosaninuagaon, Near MKCG Medical",
      city: "Berhampur",
      state: "Odisha",
      pincode: "760001",
      latitude: "19.3154",
      longitude: "84.7944",
      propertyType: "APARTMENT",
      saleType: "SALE",
      status: "AVAILABLE",
      bedroom: 2,
      bathroom: 2,
      area: 1100,
      amenities: ["Gym", "Parking", "24/7 Security", "Power Backup"],
      features: ["Near Medical College", "Good Locality", "Affordable"],
    },
    {
      title: "Commercial Space on NH-16, Berhampur",
      description: "Prime commercial space on NH-16 highway with excellent visibility for retail, showroom or restaurant business.",
      price: 7000000,
      tokenAmount: 150000,
      images: ["https://images.unsplash.com/photo-1497366216548-37526070297c", "https://images.unsplash.com/photo-1524634126442-357e0eac3c14"],
      address: "NH-16, Berhampur Bypass Road",
      city: "Berhampur",
      state: "Odisha",
      pincode: "760008",
      latitude: "19.3100",
      longitude: "84.7700",
      propertyType: "COMMERCIAL",
      saleType: "SALE",
      status: "AVAILABLE",
      bedroom: 0,
      bathroom: 1,
      area: 1800,
      amenities: ["Highway Facing", "Parking", "Loading Dock"],
      features: ["NH-16 Frontage", "Commercial Zone", "High Visibility"],
    },
  ];

  const properties = await Promise.all(
    propertyDataList.map(prop =>
      prisma.property.create({
        data: {
          ...prop,
          images: JSON.stringify(prop.images),
          amenities: JSON.stringify(prop.amenities),
          features: JSON.stringify(prop.features),
        },
      })
    )
  );

  console.log(`✅ Created ${properties.length} properties\n`);

  // ==================== BOOKINGS ====================
  console.log("📋 Creating bookings...");
  
  const bookingDataList = [
    // Various booking scenarios
    { userId: 0, propertyId: 2, status: "CONTACTED", remarks: "User interested in NH-143 commercial space. Sent details via WhatsApp." },
    { userId: 1, propertyId: 8, status: "TOKEN_PAID", tokenAmount: 500000, tokenPaidDate: new Date(), remarks: "Token amount received for Puri Road apartment. Documentation in progress.", adminNotes: "Follow up for final payment next week." },
    { userId: 2, propertyId: 1, status: "BOOKING_CONFIRMED", tokenAmount: 50000, tokenPaidDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), remarks: "Booking confirmed for Koel Nagar plot. Final documentation completed.", adminNotes: "Ready for handover." },
    { userId: 3, propertyId: 0, status: "CONTACTED", remarks: "Site visit scheduled for next week in Koel Nagar." },
    { userId: 4, propertyId: 7, status: "CONTACTED", remarks: "Customer requested additional property details and photos for Udit Nagar office." },
    { userId: 5, propertyId: 9, status: "TOKEN_PAID", tokenAmount: 36000, tokenPaidDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), remarks: "Token for Saheed Nagar rental property paid.", adminNotes: "Rental agreement to be prepared." },
    { userId: 6, propertyId: 3, status: "CANCELLED", remarks: "Customer cancelled NH-143 commercial plot due to budget constraints.", adminNotes: "Property available again." },
    { userId: 7, propertyId: 4, status: "CONTACTED", remarks: "Initial inquiry about the Civil Township villa. Sent brochure." },
    { userId: 8, propertyId: 10, status: "TOKEN_PAID", tokenAmount: 300000, tokenPaidDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), remarks: "Token received for Unit-3 market shop.", adminNotes: "Legal verification in progress." },
    { userId: 9, propertyId: 5, status: "BOOKING_CONFIRMED", tokenAmount: 100000, tokenPaidDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), remarks: "Agricultural land near Brahmani booking confirmed.", adminNotes: "Registration scheduled." },
    { userId: 10, propertyId: 12, status: "CONTACTED", remarks: "Interested in Chandrasekharpur villa. High-value client." },
    { userId: 11, propertyId: 6, status: "TOKEN_PAID", tokenAmount: 300000, tokenPaidDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), remarks: "Sector-14 penthouse booking initiated.", adminNotes: "Premium client. Priority handling." },
    { userId: 12, propertyId: 13, status: "CONTACTED", remarks: "Inquiry for CDA Sector-7 apartment. NRI client from Bhubaneswar." },
    { userId: 13, propertyId: 14, status: "BOOKING_CONFIRMED", tokenAmount: 60000, tokenPaidDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), remarks: "SCB Medical office rental confirmed.", adminNotes: "Monthly rental agreement signed." },
    { userId: 14, propertyId: 16, status: "CONTACTED", remarks: "Trishulia plot inquiry. Investment purpose." },
    { userId: 15, propertyId: 19, status: "TOKEN_PAID", tokenAmount: 500000, tokenPaidDate: new Date(), remarks: "High-value booking for Golden Beach apartment, Puri.", adminNotes: "VIP client. Executive team handling." },
    { userId: 16, propertyId: 11, status: "CANCELLED", remarks: "Booking cancelled for KIIT area apartment. Client found another property.", adminNotes: "Follow up for other options." },
    { userId: 17, propertyId: 10, status: "CONTACTED", remarks: "Unit-3 commercial inquiry. Retail business owner from Cuttack." },
    { userId: 18, propertyId: 17, status: "CONTACTED", remarks: "Budharaja apartment viewing requested." },
    { userId: 19, propertyId: 15, status: "TOKEN_PAID", tokenAmount: 84000, tokenPaidDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), remarks: "Buxi Bazaar apartment token paid.", adminNotes: "Fast-track documentation." },
    { userId: 0, propertyId: 17, status: "BOOKING_CONFIRMED", tokenAmount: 96000, tokenPaidDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), remarks: "Budharaja apartment sold.", adminNotes: "Handover completed." },
  ];

  const bookings = await Promise.all(
    bookingDataList.map(booking =>
      prisma.booking.create({
        data: {
          userId: users[booking.userId].id,
          propertyId: properties[booking.propertyId].id,
          bookingStatus: booking.status,
          tokenAmount: booking.tokenAmount || null,
          tokenPaidDate: booking.tokenPaidDate || null,
          remarks: booking.remarks,
          adminNotes: booking.adminNotes || null,
        },
      })
    )
  );

  console.log(`✅ Created ${bookings.length} bookings\n`);

  // ==================== CHATS ====================
  console.log("💬 Creating chats...");
  
  const chatsList = [];
  
  // Create chats for various user-admin combinations
  for (let i = 0; i < 20; i++) {
    const userIndex = i % users.length;
    const adminIndex = i % admins.length;
    const lastMessages = [
      "Thank you for your interest in the Koel Nagar plot. I'll send the details shortly.",
      "When can we schedule a site visit in Rourkela?",
      "Your booking for the Civil Township villa has been confirmed!",
      "Please check your email for the property documents.",
      "The Sector-2 apartment is still available. Would you like to visit?",
      "Token amount received. Processing your booking for Bhubaneswar property.",
      "Any questions about the Patia apartment?",
      "Site visit scheduled for this weekend in Rourkela.",
      "Documentation is ready for review for the CDA property.",
      "Great choice! This property in Cuttack has excellent potential.",
      "We have similar properties in Sambalpur if you're interested.",
      "Your rental agreement for Saheed Nagar is being prepared.",
      "Thanks for visiting the Puri apartment. Let me know your thoughts.",
      "Price negotiation is possible for the NH-143 commercial space.",
      "Virtual tour link sent for the Chandrasekharpur villa.",
      "Registration process for the Trishulia plot will take 2-3 weeks.",
      "Home loan assistance available for Bhubaneswar properties.",
      "Property papers for the Budharaja apartment are clear and verified.",
      "Possession for the Golden Beach apartment will be given within 30 days.",
      "Feel free to bring your family for the Hirakud Dam farmhouse visit.",
    ];
    
    const chat = await prisma.chat.create({
      data: {
        participants: {
          create: [
            { userId: users[userIndex].id, hasSeen: i % 3 === 0 },
            { userId: admins[adminIndex].id, hasSeen: i % 3 !== 0 },
          ],
        },
        lastMessage: lastMessages[i],
        updatedAt: new Date(Date.now() - (20 - i) * 24 * 60 * 60 * 1000), // Stagger chat dates
      },
    });
    chatsList.push(chat);
  }

  console.log(`✅ Created ${chatsList.length} chats\n`);

  // ==================== MESSAGES ====================
  console.log("✉️  Creating messages...");
  
  let totalMessages = 0;
  
  // Create messages for each chat (varying number of messages per chat)
  for (let i = 0; i < chatsList.length; i++) {
    const chat = chatsList[i];
    const participants = await prisma.chatParticipant.findMany({
      where: { chatId: chat.id },
    });
    const user = participants.find(p => p.userId !== admins[0].id && p.userId !== admins[1].id && p.userId !== admins[2].id);
    const admin = participants.find(p => p.userId === admins[0].id || p.userId === admins[1].id || p.userId === admins[2].id);
    
    const messageCount = 3 + (i % 5); // 3-7 messages per chat
    const baseTime = Date.now() - (20 - i) * 24 * 60 * 60 * 1000;
    
    const conversationTemplates = [
      // Template 1: Property Inquiry
      [
        { sender: 'user', text: "Hi, I saw your property listing for the Koel Nagar plot. Can you share more details?" },
        { sender: 'admin', text: "Hello! I'd be happy to help. It's a 1200 sq.ft plot in prime Rourkela location." },
        { sender: 'user', text: "What's the total price including all charges?" },
        { sender: 'admin', text: "The total price is ₹25 lakhs plus registration charges. All documents are clear." },
        { sender: 'user', text: "Can we visit this weekend?" },
        { sender: 'admin', text: "Of course! Let me schedule a site visit for Saturday morning." },
        { sender: 'user', text: "That works for me. Thanks!" },
      ],
      // Template 2: Token Payment
      [
        { sender: 'user', text: "I'm ready to pay the token amount for the Sector-2 apartment we discussed." },
        { sender: 'admin', text: "That's great! The token amount is ₹1 lakh. I'll share the payment details." },
        { sender: 'user', text: "Payment done. Transaction ID: TXN123456789" },
        { sender: 'admin', text: "Thank you! I've received the confirmation. Your booking is now secured." },
        { sender: 'user', text: "When can we proceed with the documentation?" },
      ],
      // Template 3: Site Visit
      [
        { sender: 'user', text: "Can we schedule a site visit for the Civil Township villa in Rourkela?" },
        { sender: 'admin', text: "Of course! When would you prefer to visit?" },
        { sender: 'user', text: "This Saturday morning works for me." },
        { sender: 'admin', text: "Perfect! Let's meet at 10 AM at the site. I'll send you the location on Google Maps." },
      ],
      // Template 4: Documentation Query
      [
        { sender: 'user', text: "What documents do I need to provide for the home loan for the Bhubaneswar property?" },
        { sender: 'admin', text: "You'll need ID proof, address proof, income statements, and bank statements for the last 6 months." },
        { sender: 'user', text: "I have all of these ready. Where should I submit them?" },
      ],
    ];
    
    const template = conversationTemplates[i % conversationTemplates.length];
    const messagesToCreate = template.slice(0, messageCount);
    
    for (let j = 0; j < messagesToCreate.length; j++) {
      const msg = messagesToCreate[j];
      await prisma.message.create({
        data: {
          text: msg.text,
          userId: msg.sender === 'user' ? user.userId : admin.userId,
          chatId: chat.id,
          createdAt: new Date(baseTime + j * 30 * 60 * 1000), // 30 minutes apart
        },
      });
      totalMessages++;
    }
  }

  console.log(`✅ Created ${totalMessages} messages across ${chatsList.length} chats\n`);

  // ==================== SUMMARY ====================
  console.log("\n" + "=".repeat(70));
  console.log("🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!");
  console.log("=".repeat(70));
  
  console.log("\n📌 CREDENTIALS:");
  console.log("-".repeat(70));
  console.log("🔐 Admin Logins (all have password: password123):");
  console.log("   - soumya050794@gmail.com (admin)");
  console.log("   - manager@odishaland.com (admin_manager)");
  console.log("   - support@odishaland.com (admin_support)");
  console.log("");
  console.log("👤 Test Users (all have password: password123):");
  console.log("   First 5 users:");
  for (let i = 0; i < 5; i++) {
    console.log(`   - ${userDataList[i].email} (${userDataList[i].username})`);
  }
  console.log(`   ... and ${userDataList.length - 5} more users`);
  
  console.log("\n📊 DATABASE SUMMARY:");
  console.log("-".repeat(70));
  console.log(`✓ Users: ${admins.length + staffMembers.length + users.length} (${admins.length} Admins + ${staffMembers.length} Staff + ${users.length} Users)`);
  console.log(`✓ Hero Banners: ${heroBanners.length}`);
  console.log(`✓ Partners: ${partners.length}`);
  console.log(`✓ Services: ${services.length}`);
  console.log(`✓ Testimonials: ${testimonials.length}`);
  console.log(`✓ FAQs: ${faqs.length}`);
  console.log(`✓ Team Members: ${teamMembers.length}`);
  console.log(`✓ Blog Posts: ${blogPosts.length}`);
  console.log(`✓ Leads: ${leads.length}`);
  console.log(`   - NEW: ${leads.filter(l => l.status === 'NEW').length}`);
  console.log(`   - CONTACTED: ${leads.filter(l => l.status === 'CONTACTED').length}`);
  console.log(`   - QUALIFIED: ${leads.filter(l => l.status === 'QUALIFIED').length}`);
  console.log(`   - CONVERTED: ${leads.filter(l => l.status === 'CONVERTED').length}`);
  console.log(`   - LOST: ${leads.filter(l => l.status === 'LOST').length}`);
  console.log(`✓ Contact Requests: ${contactRequests.length}`);
  console.log(`✓ SEO Settings: ${seoSettings.length}`);
  console.log(`✓ Properties: ${properties.length}`);
  console.log(`   - Rourkela: 8 properties`);
  console.log(`   - Bhubaneswar: 6 properties`);
  console.log(`   - Cuttack: 4 properties`);
  console.log(`   - Sambalpur: 3 properties`);
  console.log(`   - Puri: 2 properties`);
  console.log(`   - Berhampur: 2 properties`);
  console.log(`✓ Bookings: ${bookings.length}`);
  console.log(`✓ Chats: ${chatsList.length} (between users and admins)`);
  console.log(`✓ Messages: ${totalMessages}`);
  console.log(`✓ Company Settings: Configured (Odisha focused)`);
  console.log("=".repeat(70));
  console.log("\n✨ Your Odisha Real Estate platform is ready with comprehensive test data!");
  console.log("🚀 Start the server and explore all features with realistic Odisha scenarios!\n");
}

main()
  .catch((e) => {
    console.error("\n❌ SEEDING ERROR:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });