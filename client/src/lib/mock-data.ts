export type PropertyType = "apartment" | "villa" | "plot" | "commercial" | "penthouse" | "independent-house";
export type PropertyStatus = "available" | "booked" | "sold" | "under-construction";
export type BookingStatus = "confirmed" | "pending" | "cancelled" | "completed" | "checked-in";
export type UserRole = "admin" | "staff" | "agent" | "customer";
export type LeadStage = "new" | "contacted" | "qualified" | "proposal" | "negotiation" | "won" | "lost";
export type MessageType = "text" | "image" | "document";

export interface Property {
  id: string;
  title: string;
  type: PropertyType;
  status: PropertyStatus;
  price: number; // in INR
  pricePerUnit: string; // e.g. "45 Lakh", "1.2 Cr"
  location: string;
  city: string;
  area: number; // sq ft
  bedrooms: number;
  bathrooms: number;
  floor: string;
  image: string;
  description: string;
  amenities: string[];
  postedDate: string;
  agentId: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar: string;
  status: "active" | "inactive";
  joinDate: string;
  properties?: number;
  bookings?: number;
}

export interface Booking {
  id: string;
  propertyId: string;
  propertyTitle: string;
  clientId: string;
  clientName: string;
  agentId: string;
  agentName: string;
  status: BookingStatus;
  checkIn: string;
  checkOut: string;
  totalAmount: number;
  createdAt: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  stage: LeadStage;
  source: string;
  propertyInterest: string;
  budget: string;
  assignedTo: string;
  notes: string;
  createdAt: string;
  lastContact: string;
}

export interface ChatConversation {
  id: string;
  participantName: string;
  participantAvatar: string;
  participantRole: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  online: boolean;
  isTyping: boolean;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: MessageType;
  timestamp: string;
  isOwn: boolean;
}

export interface DashboardStats {
  totalProperties: number;
  activeBookings: number;
  totalUsers: number;
  revenue: number;
  propertiesChange: number;
  bookingsChange: number;
  usersChange: number;
  revenueChange: number;
}

export const properties: Property[] = [
  {
    id: "PROP001",
    title: "Suretreaven 3BHK Premium Apartment",
    type: "apartment",
    status: "available",
    price: 4500000,
    pricePerUnit: "45 Lakh",
    location: "Patia, Bhubaneswar",
    city: "Bhubaneswar",
    area: 1650,
    bedrooms: 3,
    bathrooms: 2,
    floor: "5th Floor",
    image: "/properties/prop1.jpg",
    description: "Spacious 3BHK apartment in the heart of Patia with modern amenities, club house, and 24/7 security.",
    amenities: ["Parking", "Gym", "Swimming Pool", "Club House", "Power Backup"],
    postedDate: "2025-12-15",
    agentId: "U003",
  },
  {
    id: "PROP002",
    title: "Royal Orchid Villa with Private Garden",
    type: "villa",
    status: "available",
    price: 12000000,
    pricePerUnit: "1.2 Cr",
    location: "Nayapalli, Bhubaneswar",
    city: "Bhubaneswar",
    area: 3200,
    bedrooms: 4,
    bathrooms: 3,
    floor: "Independent",
    image: "/properties/prop2.jpg",
    description: "Luxurious 4BHK villa with private garden, rooftop terrace, and modern interiors in premium locality.",
    amenities: ["Private Garden", "Terrace", "Security", "Power Backup", "Water Purifier"],
    postedDate: "2025-11-20",
    agentId: "U004",
  },
  {
    id: "PROP003",
    title: "Tech Park Commercial Office Space",
    type: "commercial",
    status: "booked",
    price: 8500000,
    pricePerUnit: "85 Lakh",
    location: "Infocity, Bhubaneswar",
    city: "Bhubaneswar",
    area: 2400,
    bedrooms: 0,
    bathrooms: 2,
    floor: "3rd Floor",
    image: "/properties/prop3.jpg",
    description: "Grade A commercial office space in Infocity IT hub with all modern facilities and ample parking.",
    amenities: ["Elevator", "Parking", "Fire Safety", "CCTV", "Power Backup"],
    postedDate: "2025-10-05",
    agentId: "U003",
  },
  {
    id: "PROP004",
    title: "Rourkela Residential Plot - 2400 sqft",
    type: "plot",
    status: "available",
    price: 1800000,
    pricePerUnit: "18 Lakh",
    location: "Sector-2, Rourkela",
    city: "Rourkela",
    area: 2400,
    bedrooms: 0,
    bathrooms: 0,
    floor: "Ground",
    image: "/properties/prop4.jpg",
    description: "Well-developed residential plot in Sector-2 Rourkela with clear title and all utilities available.",
    amenities: ["Road Access", "Water Supply", "Electricity", "Boundary Wall"],
    postedDate: "2025-09-12",
    agentId: "U004",
  },
  {
    id: "PROP005",
    title: "Modern 2BHK at Kalinga Vihar",
    type: "apartment",
    status: "sold",
    price: 3200000,
    pricePerUnit: "32 Lakh",
    location: "Kalinga Vihar, Bhubaneswar",
    city: "Bhubaneswar",
    area: 1100,
    bedrooms: 2,
    bathrooms: 2,
    floor: "8th Floor",
    image: "/properties/prop5.jpg",
    description: "Beautifully designed 2BHK flat with premium fittings, modular kitchen, and scenic city views.",
    amenities: ["Modular Kitchen", "Gym", "Parking", "Intercom", "Power Backup"],
    postedDate: "2025-08-18",
    agentId: "U003",
  },
  {
    id: "PROP006",
    title: "Sunrise Township - Gated Community",
    type: "apartment",
    status: "under-construction",
    price: 5500000,
    pricePerUnit: "55 Lakh",
    location: "Khandagiri, Bhubaneswar",
    city: "Bhubaneswar",
    area: 1800,
    bedrooms: 3,
    bathrooms: 2,
    floor: "12th Floor",
    image: "/properties/prop6.jpg",
    description: "Premium gated community with 12 towers, landscaped gardens, jogging track, and clubhouse.",
    amenities: ["Club House", "Jogging Track", "Landscaping", "Temple", "24/7 Security"],
    postedDate: "2026-01-10",
    agentId: "U004",
  },
  {
    id: "PROP007",
    title: "Heritage Independent House - Cuttack",
    type: "independent-house",
    status: "available",
    price: 7500000,
    pricePerUnit: "75 Lakh",
    location: "Bidanasi, Cuttack",
    city: "Cuttack",
    area: 2800,
    bedrooms: 4,
    bathrooms: 3,
    floor: "G+1",
    image: "/properties/prop7.jpg",
    description: "Spacious independent house with traditional Odia architecture blend and modern amenities.",
    amenities: ["Courtyard", "Parking", "Garden", "Power Backup", "Water Storage"],
    postedDate: "2025-12-28",
    agentId: "U003",
  },
  {
    id: "PROP008",
    title: "Sky Lounge Penthouse Suite",
    type: "penthouse",
    status: "available",
    price: 25000000,
    pricePerUnit: "2.5 Cr",
    location: "Saheed Nagar, Bhubaneswar",
    city: "Bhubaneswar",
    area: 4500,
    bedrooms: 5,
    bathrooms: 4,
    floor: "Top Floor",
    image: "/properties/prop8.jpg",
    description: "Ultra-luxury penthouse with private terrace pool, 360° city views, and smart home features.",
    amenities: ["Private Pool", "Terrace", "Smart Home", "Concierge", "Gym"],
    postedDate: "2026-01-05",
    agentId: "U004",
  },
  {
    id: "PROP009",
    title: "Market Square Retail Shop",
    type: "commercial",
    status: "booked",
    price: 4200000,
    pricePerUnit: "42 Lakh",
    location: "Unit-3 Market, Bhubaneswar",
    city: "Bhubaneswar",
    area: 650,
    bedrooms: 0,
    bathrooms: 1,
    floor: "Ground Floor",
    image: "/properties/prop9.jpg",
    description: "Prime retail shop space in the bustling Unit-3 market area with high footfall.",
    amenities: ["Frontage", "Parking", "Storage", "AC", "CCTV"],
    postedDate: "2025-11-30",
    agentId: "U003",
  },
  {
    id: "PROP010",
    title: "Green Acres Farm House",
    type: "independent-house",
    status: "available",
    price: 3800000,
    pricePerUnit: "38 Lakh",
    location: "Jatni, Bhubaneswar Outskirts",
    city: "Bhubaneswar",
    area: 5000,
    bedrooms: 3,
    bathrooms: 2,
    floor: "Independent",
    image: "/properties/prop10.jpg",
    description: "Peaceful farmhouse on 5 guntha land with fruit trees, well, and open space near Jatni.",
    amenities: ["Well", "Fruit Trees", "Open Space", "Storage Room", "Gate"],
    postedDate: "2025-10-20",
    agentId: "U004",
  },
];

export const users: User[] = [
  {
    id: "U001",
    name: "Rajesh Kumar Mohapatra",
    email: "rajesh@greenvalley.in",
    phone: "+91 98765 43210",
    role: "admin",
    avatar: "",
    status: "active",
    joinDate: "2023-01-15",
    properties: 10,
    bookings: 12,
  },
  {
    id: "U002",
    name: "Priya Dash",
    email: "priya@greenvalley.in",
    phone: "+91 87654 32109",
    role: "staff",
    avatar: "",
    status: "active",
    joinDate: "2023-06-20",
    bookings: 8,
  },
  {
    id: "U003",
    name: "Amit Sahoo",
    email: "amit@greenvalley.in",
    phone: "+91 76543 21098",
    role: "agent",
    avatar: "",
    status: "active",
    joinDate: "2023-09-10",
    properties: 5,
    bookings: 7,
  },
  {
    id: "U004",
    name: "Sunita Rout",
    email: "sunita@greenvalley.in",
    phone: "+91 65432 10987",
    role: "agent",
    avatar: "",
    status: "active",
    joinDate: "2024-02-01",
    properties: 5,
    bookings: 6,
  },
  {
    id: "U005",
    name: "Debashish Mishra",
    email: "debashish.m@gmail.com",
    phone: "+91 54321 09876",
    role: "customer",
    avatar: "",
    status: "active",
    joinDate: "2024-05-15",
    bookings: 2,
  },
  {
    id: "U006",
    name: "Anita Patra",
    email: "anita.p@gmail.com",
    phone: "+91 43210 98765",
    role: "customer",
    avatar: "",
    status: "active",
    joinDate: "2024-07-22",
    bookings: 1,
  },
];

export const bookings: Booking[] = [
  {
    id: "BK001",
    propertyId: "PROP003",
    propertyTitle: "Tech Park Commercial Office Space",
    clientId: "U005",
    clientName: "Debashish Mishra",
    agentId: "U003",
    agentName: "Amit Sahoo",
    status: "confirmed",
    checkIn: "2026-02-01",
    checkOut: "2026-02-28",
    totalAmount: 850000,
    createdAt: "2026-01-15",
  },
  {
    id: "BK002",
    propertyId: "PROP009",
    propertyTitle: "Market Square Retail Shop",
    clientId: "U006",
    clientName: "Anita Patra",
    agentId: "U003",
    agentName: "Amit Sahoo",
    status: "pending",
    checkIn: "2026-03-01",
    checkOut: "2027-02-28",
    totalAmount: 504000,
    createdAt: "2026-01-18",
  },
  {
    id: "BK003",
    propertyId: "PROP005",
    propertyTitle: "Modern 2BHK at Kalinga Vihar",
    clientId: "U005",
    clientName: "Debashish Mishra",
    agentId: "U004",
    agentName: "Sunita Rout",
    status: "completed",
    checkIn: "2025-09-01",
    checkOut: "2025-12-31",
    totalAmount: 3200000,
    createdAt: "2025-08-20",
  },
  {
    id: "BK004",
    propertyId: "PROP001",
    propertyTitle: "Suretreaven 3BHK Premium Apartment",
    clientId: "U006",
    clientName: "Anita Patra",
    agentId: "U003",
    agentName: "Amit Sahoo",
    status: "confirmed",
    checkIn: "2026-02-15",
    checkOut: "2027-02-14",
    totalAmount: 45000,
    createdAt: "2026-01-10",
  },
  {
    id: "BK005",
    propertyId: "PROP002",
    propertyTitle: "Royal Orchid Villa with Private Garden",
    clientId: "U005",
    clientName: "Debashish Mishra",
    agentId: "U004",
    agentName: "Sunita Rout",
    status: "pending",
    checkIn: "2026-04-01",
    checkOut: "2026-04-30",
    totalAmount: 120000,
    createdAt: "2026-01-20",
  },
  {
    id: "BK006",
    propertyId: "PROP008",
    propertyTitle: "Sky Lounge Penthouse Suite",
    clientId: "U006",
    clientName: "Anita Patra",
    agentId: "U004",
    agentName: "Sunita Rout",
    status: "pending",
    checkIn: "2026-05-01",
    checkOut: "2026-05-07",
    totalAmount: 350000,
    createdAt: "2026-01-22",
  },
  {
    id: "BK007",
    propertyId: "PROP007",
    propertyTitle: "Heritage Independent House - Cuttack",
    clientId: "U005",
    clientName: "Debashish Mishra",
    agentId: "U003",
    agentName: "Amit Sahoo",
    status: "cancelled",
    checkIn: "2026-01-25",
    checkOut: "2026-01-28",
    totalAmount: 75000,
    createdAt: "2026-01-12",
  },
  {
    id: "BK008",
    propertyId: "PROP010",
    propertyTitle: "Green Acres Farm House",
    clientId: "U006",
    clientName: "Anita Patra",
    agentId: "U003",
    agentName: "Amit Sahoo",
    status: "checked-in",
    checkIn: "2026-01-20",
    checkOut: "2026-01-25",
    totalAmount: 20000,
    createdAt: "2026-01-18",
  },
  {
    id: "BK009",
    propertyId: "PROP006",
    propertyTitle: "Sunrise Township - Gated Community",
    clientId: "U005",
    clientName: "Debashish Mishra",
    agentId: "U004",
    agentName: "Sunita Rout",
    status: "pending",
    checkIn: "2026-08-01",
    checkOut: "2027-07-31",
    totalAmount: 5500000,
    createdAt: "2026-01-25",
  },
  {
    id: "BK010",
    propertyId: "PROP004",
    propertyTitle: "Rourkela Residential Plot - 2400 sqft",
    clientId: "U006",
    clientName: "Anita Patra",
    agentId: "U003",
    agentName: "Amit Sahoo",
    status: "confirmed",
    checkIn: "2026-03-15",
    checkOut: "2026-03-15",
    totalAmount: 1800000,
    createdAt: "2026-01-20",
  },
  {
    id: "BK011",
    propertyId: "PROP001",
    propertyTitle: "Suretreaven 3BHK Premium Apartment",
    clientId: "U005",
    clientName: "Debashish Mishra",
    agentId: "U003",
    agentName: "Amit Sahoo",
    status: "completed",
    checkIn: "2025-06-01",
    checkOut: "2025-08-31",
    totalAmount: 90000,
    createdAt: "2025-05-25",
  },
];

export const leads: Lead[] = [
  {
    id: "LD001",
    name: "Sanjay Behera",
    email: "sanjay.b@email.com",
    phone: "+91 99887 76655",
    stage: "new",
    source: "Website",
    propertyInterest: "3BHK Apartment in Patia",
    budget: "40-50 Lakh",
    assignedTo: "Amit Sahoo",
    notes: "Interested in ready-to-move apartments. Prefers higher floors.",
    createdAt: "2026-01-25",
    lastContact: "2026-01-25",
  },
  {
    id: "LD002",
    name: "Meera Panda",
    email: "meera.p@email.com",
    phone: "+91 88776 65544",
    stage: "contacted",
    source: "Referral",
    propertyInterest: "Villa in Nayapalli",
    budget: "1-1.5 Cr",
    assignedTo: "Sunita Rout",
    notes: "Called on Jan 24. Looking for villa with garden. Will visit on weekend.",
    createdAt: "2026-01-22",
    lastContact: "2026-01-24",
  },
  {
    id: "LD003",
    name: "Rakesh Tripathy",
    email: "rakesh.t@email.com",
    phone: "+91 77665 54433",
    stage: "qualified",
    source: "JustDial",
    propertyInterest: "Commercial Space in Infocity",
    budget: "80 Lakh - 1 Cr",
    assignedTo: "Amit Sahoo",
    notes: "IT company looking for office space. Need 2000+ sq ft. Pre-approved loan.",
    createdAt: "2026-01-15",
    lastContact: "2026-01-23",
  },
  {
    id: "LD004",
    name: "Lipi Mohanty",
    email: "lipi.m@email.com",
    phone: "+91 66554 43322",
    stage: "proposal",
    source: "Facebook Ads",
    propertyInterest: "2BHK in Kalinga Vihar",
    budget: "30-35 Lakh",
    assignedTo: "Sunita Rout",
    notes: "Proposal sent for PROP005 similar flat. Awaiting response.",
    createdAt: "2026-01-10",
    lastContact: "2026-01-22",
  },
  {
    id: "LD005",
    name: "Bikram Keshari",
    email: "bikram.k@email.com",
    phone: "+91 55443 32211",
    stage: "negotiation",
    source: "Walk-in",
    propertyInterest: "Penthouse in Saheed Nagar",
    budget: "2-3 Cr",
    assignedTo: "Amit Sahoo",
    notes: "Negotiating on PROP008. Wants 10% discount and free furnishing.",
    createdAt: "2025-12-28",
    lastContact: "2026-01-24",
  },
  {
    id: "LD006",
    name: "Tapaswini Swain",
    email: "tapaswini.s@email.com",
    phone: "+91 44332 21100",
    stage: "won",
    source: "Website",
    propertyInterest: "Farm House near Jatni",
    budget: "35-40 Lakh",
    assignedTo: "Sunita Rout",
    notes: "Deal closed for PROP010. Agreement signed. Payment initiated.",
    createdAt: "2025-12-15",
    lastContact: "2026-01-20",
  },
  {
    id: "LD007",
    name: "Chinmaya Das",
    email: "chinmaya.d@email.com",
    phone: "+91 33221 10099",
    stage: "lost",
    source: "MagicBricks",
    propertyInterest: "3BHK in Khandagiri",
    budget: "50-60 Lakh",
    assignedTo: "Amit Sahoo",
    notes: "Went with competitor. Price was the main concern.",
    createdAt: "2025-11-20",
    lastContact: "2025-12-10",
  },
  {
    id: "LD008",
    name: "Priti Jena",
    email: "priti.j@email.com",
    phone: "+91 22110 09988",
    stage: "new",
    source: "Google Ads",
    propertyInterest: "Plot in Rourkela",
    budget: "15-20 Lakh",
    assignedTo: "Sunita Rout",
    notes: "New inquiry. Looking for residential plot for investment purpose.",
    createdAt: "2026-01-26",
    lastContact: "2026-01-26",
  },
  {
    id: "LD009",
    name: "Arun Kumar Singh",
    email: "arun.s@email.com",
    phone: "+91 11009 98877",
    stage: "contacted",
    source: "Referral",
    propertyInterest: "Commercial Shop in Unit-3",
    budget: "40-50 Lakh",
    assignedTo: "Amit Sahoo",
    notes: "Restaurant owner looking for ground floor shop. Called once.",
    createdAt: "2026-01-24",
    lastContact: "2026-01-25",
  },
];

export const conversations: ChatConversation[] = [
  {
    id: "CONV001",
    participantName: "Debashish Mishra",
    participantAvatar: "",
    participantRole: "customer",
    lastMessage: "Thank you for the site visit arrangements!",
    lastMessageTime: "10:32 AM",
    unreadCount: 2,
    online: true,
    isTyping: false,
  },
  {
    id: "CONV002",
    participantName: "Anita Patra",
    participantAvatar: "",
    participantRole: "customer",
    lastMessage: "Can we schedule a visit for the penthouse this Saturday?",
    lastMessageTime: "Yesterday",
    unreadCount: 0,
    online: false,
    isTyping: false,
  },
  {
    id: "CONV003",
    participantName: "Amit Sahoo",
    participantAvatar: "",
    participantRole: "agent",
    lastMessage: "Updated the property listing for Tech Park. Please review.",
    lastMessageTime: "Yesterday",
    unreadCount: 3,
    online: true,
    isTyping: true,
  },
  {
    id: "CONV004",
    participantName: "Sunita Rout",
    participantAvatar: "",
    participantRole: "agent",
    lastMessage: "The client for the farmhouse has signed the agreement.",
    lastMessageTime: "Mon",
    unreadCount: 0,
    online: false,
    isTyping: false,
  },
  {
    id: "CONV005",
    participantName: "Sanjay Behera",
    participantAvatar: "",
    participantRole: "lead",
    lastMessage: "I am interested in the Patia 3BHK. What is the payment plan?",
    lastMessageTime: "Mon",
    unreadCount: 1,
    online: false,
    isTyping: false,
  },
  {
    id: "CONV006",
    participantName: "Meera Panda",
    participantAvatar: "",
    participantRole: "lead",
    lastMessage: "Sure, I will come for the site visit this Saturday at 11 AM.",
    lastMessageTime: "Sun",
    unreadCount: 0,
    online: true,
    isTyping: false,
  },
];

export const messages: Record<string, ChatMessage[]> = {
  CONV001: [
    {
      id: "MSG001",
      conversationId: "CONV001",
      senderId: "U005",
      senderName: "Debashish Mishra",
      content: "Hi, I wanted to know more about the Suretreaven 3BHK apartment.",
      type: "text",
      timestamp: "10:15 AM",
      isOwn: false,
    },
    {
      id: "MSG002",
      conversationId: "CONV001",
      senderId: "U001",
      senderName: "You",
      content: "Hello Debashish! The Suretreaven 3BHK is one of our premium listings in Patia. It's 1650 sq ft on the 5th floor with a beautiful city view. The price is ₹45 Lakh.",
      type: "text",
      timestamp: "10:18 AM",
      isOwn: true,
    },
    {
      id: "MSG003",
      conversationId: "CONV001",
      senderId: "U005",
      senderName: "Debashish Mishra",
      content: "That sounds good. Can I schedule a site visit this weekend?",
      type: "text",
      timestamp: "10:22 AM",
      isOwn: false,
    },
    {
      id: "MSG004",
      conversationId: "CONV001",
      senderId: "U001",
      senderName: "You",
      content: "Absolutely! How about Saturday at 11 AM? Our agent Amit Sahoo will accompany you.",
      type: "text",
      timestamp: "10:25 AM",
      isOwn: true,
    },
    {
      id: "MSG005",
      conversationId: "CONV001",
      senderId: "U005",
      senderName: "Debashish Mishra",
      content: "Saturday 11 AM works perfectly. Looking forward to it!",
      type: "text",
      timestamp: "10:28 AM",
      isOwn: false,
    },
    {
      id: "MSG006",
      conversationId: "CONV001",
      senderId: "U001",
      senderName: "You",
      content: "Great! Amit will call you on Saturday morning with the exact location details. Please carry a valid ID for the visit.",
      type: "text",
      timestamp: "10:30 AM",
      isOwn: true,
    },
    {
      id: "MSG007",
      conversationId: "CONV001",
      senderId: "U005",
      senderName: "Debashish Mishra",
      content: "Thank you for the site visit arrangements!",
      type: "text",
      timestamp: "10:32 AM",
      isOwn: false,
    },
  ],
  CONV002: [
    {
      id: "MSG008",
      conversationId: "CONV002",
      senderId: "U006",
      senderName: "Anita Patra",
      content: "I saw the penthouse listing online. Is it still available?",
      type: "text",
      timestamp: "2:30 PM",
      isOwn: false,
    },
    {
      id: "MSG009",
      conversationId: "CONV002",
      senderId: "U001",
      senderName: "You",
      content: "Yes, the Sky Lounge Penthouse Suite is still available. It's a 4500 sq ft ultra-luxury property with a private terrace pool. Priced at ₹2.5 Cr.",
      type: "text",
      timestamp: "2:35 PM",
      isOwn: true,
    },
    {
      id: "MSG010",
      conversationId: "CONV002",
      senderId: "U006",
      senderName: "Anita Patra",
      content: "Can we schedule a visit for the penthouse this Saturday?",
      type: "text",
      timestamp: "2:40 PM",
      isOwn: false,
    },
  ],
  CONV003: [
    {
      id: "MSG011",
      conversationId: "CONV003",
      senderId: "U003",
      senderName: "Amit Sahoo",
      content: "Rajesh sir, I have updated the Tech Park listing with new photos and floor plan.",
      type: "text",
      timestamp: "4:10 PM",
      isOwn: false,
    },
    {
      id: "MSG012",
      conversationId: "CONV003",
      senderId: "U001",
      senderName: "You",
      content: "Good work Amit. Also, please add the updated pricing for the commercial spaces.",
      type: "text",
      timestamp: "4:15 PM",
      isOwn: true,
    },
    {
      id: "MSG013",
      conversationId: "CONV003",
      senderId: "U003",
      senderName: "Amit Sahoo",
      content: "Updated the property listing for Tech Park. Please review.",
      type: "text",
      timestamp: "4:45 PM",
      isOwn: false,
    },
  ],
  CONV004: [
    {
      id: "MSG014",
      conversationId: "CONV004",
      senderId: "U004",
      senderName: "Sunita Rout",
      content: "Great news! Tapaswini Swain has signed the agreement for the farmhouse property.",
      type: "text",
      timestamp: "11:00 AM",
      isOwn: false,
    },
    {
      id: "MSG015",
      conversationId: "CONV004",
      senderId: "U001",
      senderName: "You",
      content: "Excellent work Sunita! Please ensure all documents are properly filed.",
      type: "text",
      timestamp: "11:05 AM",
      isOwn: true,
    },
    {
      id: "MSG016",
      conversationId: "CONV004",
      senderId: "U004",
      senderName: "Sunita Rout",
      content: "The client for the farmhouse has signed the agreement.",
      type: "text",
      timestamp: "11:10 AM",
      isOwn: false,
    },
  ],
  CONV005: [
    {
      id: "MSG017",
      conversationId: "CONV005",
      senderId: "LEAD",
      senderName: "Sanjay Behera",
      content: "Hello, I am interested in the 3BHK apartment in Patia. Can you share details?",
      type: "text",
      timestamp: "9:00 AM",
      isOwn: false,
    },
    {
      id: "MSG018",
      conversationId: "CONV005",
      senderId: "U001",
      senderName: "You",
      content: "Hi Sanjay! The Suretreaven 3BHK in Patia is 1650 sq ft, priced at ₹45 Lakh. It includes parking, gym, swimming pool, and 24/7 security.",
      type: "text",
      timestamp: "9:10 AM",
      isOwn: true,
    },
    {
      id: "MSG019",
      conversationId: "CONV005",
      senderId: "LEAD",
      senderName: "Sanjay Behera",
      content: "I am interested in the Patia 3BHK. What is the payment plan?",
      type: "text",
      timestamp: "9:15 AM",
      isOwn: false,
    },
  ],
  CONV006: [
    {
      id: "MSG020",
      conversationId: "CONV006",
      senderId: "LEAD",
      senderName: "Meera Panda",
      content: "I want to see the villa in Nayapalli. When can I visit?",
      type: "text",
      timestamp: "3:00 PM",
      isOwn: false,
    },
    {
      id: "MSG021",
      conversationId: "CONV006",
      senderId: "U001",
      senderName: "You",
      content: "Hi Meera! We can arrange a visit this Saturday at 11 AM. Would that work for you?",
      type: "text",
      timestamp: "3:10 PM",
      isOwn: true,
    },
    {
      id: "MSG022",
      conversationId: "CONV006",
      senderId: "LEAD",
      senderName: "Meera Panda",
      content: "Sure, I will come for the site visit this Saturday at 11 AM.",
      type: "text",
      timestamp: "3:20 PM",
      isOwn: false,
    },
  ],
};

export const dashboardStats: DashboardStats = {
  totalProperties: 10,
  activeBookings: 6,
  totalUsers: 6,
  revenue: 12750000,
  propertiesChange: 12.5,
  bookingsChange: 8.3,
  usersChange: 15.0,
  revenueChange: 22.4,
};

export const monthlyRevenue = [
  { month: "Aug", revenue: 980000 },
  { month: "Sep", revenue: 1250000 },
  { month: "Oct", revenue: 870000 },
  { month: "Nov", revenue: 1520000 },
  { month: "Dec", revenue: 1100000 },
  { month: "Jan", revenue: 1340000 },
];

export const propertyTypeDistribution = [
  { type: "Apartment", count: 3, fill: "var(--color-chart-1)" },
  { type: "Villa", count: 1, fill: "var(--color-chart-2)" },
  { type: "Plot", count: 1, fill: "var(--color-chart-3)" },
  { type: "Commercial", count: 2, fill: "var(--color-chart-4)" },
  { type: "Penthouse", count: 1, fill: "var(--color-chart-5)" },
  { type: "Independent", count: 2, fill: "var(--color-primary)" },
];

export const recentActivity = [
  { id: 1, action: "New booking confirmed", detail: "Tech Park Commercial - Debashish Mishra", time: "2 hours ago", type: "booking" as const },
  { id: 2, action: "Property listed", detail: "Sunrise Township - Gated Community", time: "5 hours ago", type: "property" as const },
  { id: 3, action: "Lead converted", detail: "Tapaswini Swain → Farm House deal", time: "1 day ago", type: "lead" as const },
  { id: 4, action: "Payment received", detail: "₹18 Lakh - Rourkela Plot", time: "1 day ago", type: "payment" as const },
  { id: 5, action: "New user registered", detail: "Priti Jena (Customer)", time: "2 days ago", type: "user" as const },
  { id: 6, action: "Site visit completed", detail: "Anita Patra - Penthouse Suite", time: "2 days ago", type: "property" as const },
  { id: 7, action: "Booking cancelled", detail: "Heritage House - Debashish Mishra", time: "3 days ago", type: "booking" as const },
  { id: 8, action: "New lead captured", detail: "Arun Kumar Singh via Referral", time: "3 days ago", type: "lead" as const },
];