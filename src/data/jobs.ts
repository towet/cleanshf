import cleanerImg from "@/assets/jobs/cleaner.jpg";
import guardImg from "@/assets/jobs/guard.jpg";
import salesAttendantImg from "@/assets/jobs/sales-attendant.jpg";
import receptionistImg from "@/assets/jobs/receptionist.jpg";
import storeKeeperImg from "@/assets/jobs/store-keeper.jpg";
import distributorImg from "@/assets/jobs/distributor.jpg";
import driverImg from "@/assets/jobs/driver.jpg";
import accountantImg from "@/assets/jobs/accountant.jpg";
import loaderImg from "@/assets/jobs/loader.jpg";
import supervisorImg from "@/assets/jobs/supervisor.jpg";
import chefImg from "@/assets/jobs/chef.jpg";

export interface Job {
  id: string;
  title: string;
  salary: number;
  medicalAllowance: number;
  icon: string;
  image: string;
  category: string;
  description: string;
}

export const jobs: Job[] = [
  {
    id: "cleaner",
    title: "Cleaner",
    salary: 22400,
    medicalAllowance: 500,
    icon: "🧹",
    image: cleanerImg,
    category: "Operations",
    description: "Maintain cleanliness and hygiene standards across the store",
  },
  {
    id: "guard",
    title: "Guard",
    salary: 27000,
    medicalAllowance: 700,
    icon: "🛡️",
    image: guardImg,
    category: "Security",
    description: "Ensure safety and security of premises and customers",
  },
  {
    id: "sales-attendant",
    title: "Sales Attendant",
    salary: 25000,
    medicalAllowance: 500,
    icon: "🛒",
    image: salesAttendantImg,
    category: "Sales",
    description: "Assist customers and manage product displays",
  },
  {
    id: "receptionist",
    title: "Receptionist",
    salary: 34000,
    medicalAllowance: 3000,
    icon: "📞",
    image: receptionistImg,
    category: "Administration",
    description: "Front desk management and customer service",
  },
  {
    id: "store-keeper",
    title: "Store Keeper",
    salary: 22000,
    medicalAllowance: 500,
    icon: "📦",
    image: storeKeeperImg,
    category: "Inventory",
    description: "Manage stock inventory and storage organization",
  },
  {
    id: "distributor-marketer",
    title: "Distributor & Marketer",
    salary: 29000,
    medicalAllowance: 1500,
    icon: "📊",
    image: distributorImg,
    category: "Marketing",
    description: "Product distribution and marketing activities",
  },
  {
    id: "driver",
    title: "Driver",
    salary: 27400,
    medicalAllowance: 2500,
    icon: "🚛",
    image: driverImg,
    category: "Logistics",
    description: "Transport goods and ensure timely deliveries",
  },
  {
    id: "accountant-cashier",
    title: "Accountant & Cashier",
    salary: 32000,
    medicalAllowance: 3000,
    icon: "💰",
    image: accountantImg,
    category: "Finance",
    description: "Handle financial transactions and bookkeeping",
  },
  {
    id: "loader",
    title: "Loader & Off-loader",
    salary: 17000,
    medicalAllowance: 500,
    icon: "💪",
    image: loaderImg,
    category: "Warehouse",
    description: "Loading and unloading of goods and merchandise",
  },
  {
    id: "warehouse-supervisor",
    title: "Warehouse Supervisor",
    salary: 31000,
    medicalAllowance: 2000,
    icon: "📋",
    image: supervisorImg,
    category: "Management",
    description: "Oversee warehouse operations and staff",
  },
  {
    id: "chef",
    title: "Chef",
    salary: 23750,
    medicalAllowance: 1500,
    icon: "👨‍🍳",
    image: chefImg,
    category: "Food Services",
    description: "Prepare quality meals for staff and customers",
  },
];

export const qualifications = [
  "Must be KENYAN of 18 years and above",
  "Reliability and trustworthiness",
  "Punctuality, time management and a sense of urgency",
  "Strong communication skills",
  "Good customer service skills",
  "Clean driving record and driving licence (Driving applicants)",
  "Ability to move and deliver items to recipients (Packers and sales attendants)",
];

export const locations = [
  "Nairobi",
  "Mombasa",
  "Kisumu",
  "Nakuru",
  "Eldoret",
  "Thika",
  "Nyeri",
  "Machakos",
  "Meru",
  "Kakamega",
];

export const educationLevels = [
  "Primary School",
  "Secondary School (KCSE)",
  "Certificate",
  "Diploma",
  "Degree",
  "Masters",
];
