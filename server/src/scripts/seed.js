import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Workshop } from '../models/Workshop.js';
import { Review } from '../models/Review.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.utils.js';

const seedDatabase = async () => {
  try {
    await mongoose.connect(env.MONGODB_URI);
    logger.info('Connected to MongoDB for database seeding...');

    // Clear existing collections safely
    await User.deleteMany({});
    await Workshop.deleteMany({});
    await Review.deleteMany({});

    logger.info('Cleaned old users, workshops, and reviews.');

    // 1. Create Users
    const salt = await bcrypt.genSalt(10);
    const adminPasswordHash = await bcrypt.hash('Admin@Workshoply2026', salt);
    const userPasswordHash = await bcrypt.hash('User@Workshoply2026', salt);

    const admin = await User.create({
      name: 'snehkheni',
      email: 'admin@workshoply.dev',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      bio: 'Platform Administrator for Workshoply.'
    });

    logger.info('Created single admin user: snehkheni (admin@workshoply.dev)');

    // 2. Realistic workshops across diverse categories
    const now = new Date();
    const addDays = (d, days) => new Date(d.getTime() + days * 24 * 60 * 60 * 1000);
    const addHours = (d, hours) => new Date(d.getTime() + hours * 60 * 60 * 1000);

    const sampleWorkshops = [
      {
        title: 'Mastering Full-Stack React & Node.js Architecture',
        category: 'Web Development',
        shortDescription: 'Build scalable modern web applications with React 19, Node.js microservices, and MongoDB.',
        description: 'Take your web development skills from intermediate to staff-level engineering. In this intensive masterclass, you will build and architect resilient REST and GraphQL APIs, integrate authentication, manage state cleanly, optimize database queries, and deploy production-ready applications with zero downtime.',
        coverImage: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=1200&q=80',
        instructor: {
          name: 'Vikram Sengupta',
          title: 'Principal Software Architect at FinTechScale',
          bio: '14+ years experience building distributed microservices and front-end architectures serving 50M+ requests daily.',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
        },
        priceInPaise: 199900, // ₹1,999
        currency: 'INR',
        venue: {
          type: 'ONLINE',
          meetingLink: 'https://meet.google.com/xyz-workshoply-demo'
        },
        deliveryMode: 'ONLINE',
        startDateTime: addDays(now, 5),
        endDateTime: addHours(addDays(now, 5), 4),
        registrationDeadline: addDays(now, 4),
        capacity: 35,
        bookedSeats: 8,
        status: 'PUBLISHED',
        skillLevel: 'INTERMEDIATE',
        prerequisites: ['Basic JavaScript ES6+', 'Fundamentals of React components', 'HTML & CSS familiarity'],
        whatYouWillLearn: [
          'Enterprise component architecture and design tokens',
          'JWT access & refresh tokens with security headers',
          'Concurrency-safe MongoDB transactions and atomic updates',
          'Real-world payment gateway integrations with webhook resilience'
        ],
        cancellationPolicy: 'Full refund if cancelled at least 48 hours before the start time.'
      },
      {
        title: 'Generative AI & LLM Engineering with Python',
        category: 'Artificial Intelligence',
        shortDescription: 'Learn RAG pipelines, fine-tuning, embeddings, and autonomous agent orchestration with LangChain.',
        description: 'Harness the power of Large Language Models. Move past simple chat prompts to engineering robust generative AI workflows. We cover Vector databases (Chroma, Pinecone), retrieval-augmented generation (RAG) pipelines, evaluations, tool-calling agents, and deployment on serverless GPUs.',
        coverImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80',
        instructor: {
          name: 'Dr. Rohini Ramanathan',
          title: 'AI Research Scientist & Ex-Stanford Fellow',
          bio: 'Specialist in deep neural architectures, transformer models, and applied generative intelligence.',
          avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80'
        },
        priceInPaise: 299900, // ₹2,999
        currency: 'INR',
        venue: {
          type: 'ONLINE',
          meetingLink: 'https://zoom.us/j/workshoply-genai'
        },
        deliveryMode: 'ONLINE',
        startDateTime: addDays(now, 9),
        endDateTime: addHours(addDays(now, 9), 6),
        registrationDeadline: addDays(now, 8),
        capacity: 40,
        bookedSeats: 22,
        status: 'PUBLISHED',
        skillLevel: 'ADVANCED',
        prerequisites: ['Proficiency with Python 3', 'Foundational linear algebra & machine learning intuition'],
        whatYouWillLearn: [
          'Building low-latency RAG architectures',
          'Optimizing embeddings and semantic search indexes',
          'Autonomous agent loops with memory and tools',
          'Guardrails, evaluation suites, and cost management'
        ]
      },
      {
        title: 'Design Systems from Scratch: Figma to Code',
        category: 'UI/UX Design',
        shortDescription: 'Craft tokenized, accessible, and scalable design systems matching industry design benchmarks.',
        description: 'Design systems bridge the gap between creative designers and frontend engineers. This workshop guides you through creating tokenized typography, responsive layouts, color systems, component libraries, and interactive design prototypes that export effortlessly into clean React code.',
        coverImage: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=1200&q=80',
        instructor: {
          name: 'Kavita Menon',
          title: 'Head of Product Design at Studio Craft',
          bio: 'Award-winning UI/UX designer with a portfolio of over 40 global brands and enterprise design systems.',
          avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80'
        },
        priceInPaise: 149900, // ₹1,499
        currency: 'INR',
        venue: {
          type: 'PHYSICAL',
          address: 'WeWork Galaxy, 43 Residency Road',
          city: 'Bengaluru'
        },
        deliveryMode: 'IN_PERSON',
        startDateTime: addDays(now, 12),
        endDateTime: addHours(addDays(now, 12), 5),
        registrationDeadline: addDays(now, 11),
        capacity: 25,
        bookedSeats: 21, // Filling fast!
        status: 'PUBLISHED',
        skillLevel: 'ALL_LEVELS',
        prerequisites: ['Basic familiarity with Figma or digital wireframing tools'],
        whatYouWillLearn: [
          'Design tokens structure (colors, spacing, typography)',
          'Accessible WCAG color contrast standards',
          'Figma auto-layout components and variant properties',
          'Hand-off workflows with Tailwind CSS variables'
        ]
      },
      {
        title: 'Data Science & Visual Analytics Bootcamp',
        category: 'Data Science',
        shortDescription: 'Extract actionable business intelligence from complex real-world datasets with Pandas and Seaborn.',
        description: 'Transform raw data into compelling narrative dashboards. Learn data cleaning pipelines, statistical modeling, exploratory analysis, correlation discovery, and automated executive reporting using Jupyter and modern visualization libraries.',
        coverImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
        instructor: {
          name: 'Arjun Dasgupta',
          title: 'Lead Data Strategist at AnalyticsHQ',
          bio: 'Former senior data consultant for Fortune 500 retailers and financial institutions.',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80'
        },
        priceInPaise: 179900, // ₹1,799
        currency: 'INR',
        venue: {
          type: 'ONLINE',
          meetingLink: 'https://meet.google.com/datascience-live'
        },
        deliveryMode: 'ONLINE',
        startDateTime: addDays(now, 14),
        endDateTime: addHours(addDays(now, 14), 4),
        registrationDeadline: addDays(now, 13),
        capacity: 50,
        bookedSeats: 12,
        status: 'PUBLISHED',
        skillLevel: 'BEGINNER',
        prerequisites: ['High school math', 'Any basic computer programming experience'],
        whatYouWillLearn: [
          'Automated data cleaning and handling missing values',
          'Statistical hypothesis testing and distributions',
          'Interactive dashboards with Plotly and Seaborn',
          'Predictive classification and regression models'
        ]
      },
      {
        title: 'High-Impact Performance Marketing & Growth Hacking',
        category: 'Digital Marketing',
        shortDescription: 'Scale customer acquisition cost-effectively across Meta Ads, Google Ads, and viral organic loops.',
        description: 'Stop burning budget on unoptimized ads. This playbook covers precise conversion funnel tracking, attribution modeling, copy hooks that convert, CAC/LTV mathematics, retargeting mechanisms, and retention optimization.',
        coverImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
        instructor: {
          name: 'Meera Nambiar',
          title: 'Growth Director at ScaleRocket',
          bio: 'Managed over ₹15 Crore in profitable ad spend across D2C, SaaS, and consumer tech.',
          avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80'
        },
        priceInPaise: 129900, // ₹1,299
        currency: 'INR',
        venue: {
          type: 'HYBRID',
          address: '91springboard, BKC Complex',
          city: 'Mumbai',
          meetingLink: 'https://zoom.us/j/marketing-growth'
        },
        deliveryMode: 'HYBRID',
        startDateTime: addDays(now, 7),
        endDateTime: addHours(addDays(now, 7), 4),
        registrationDeadline: addDays(now, 6),
        capacity: 30,
        bookedSeats: 29, // Filling fast!
        status: 'PUBLISHED',
        skillLevel: 'INTERMEDIATE',
        prerequisites: ['Basic understanding of social media marketing or online commerce'],
        whatYouWillLearn: [
          'Designing high-converting landing page hooks',
          'Audience segmentation and lookalike calibration',
          'Attribution modeling and tracking cookies post-iOS 14',
          'Iterative A/B testing of creative angles'
        ]
      },
      {
        title: 'Zero to Launch: Startup Ideation to Seed Funding',
        category: 'Entrepreneurship',
        shortDescription: 'Validate startup hypotheses, construct viable unit economics, and prepare investor-ready pitch decks.',
        description: 'Turn your concept into an operational enterprise. Learn how to conduct customer discovery without leading questions, build MVPs on minimal capital, structure capitalization tables, draft term sheets, and pitch to angel investors.',
        coverImage: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=1200&q=80',
        instructor: {
          name: 'Rajiv Chawla',
          title: 'Serial Founder & Venture Partner at AlphaSeed',
          bio: 'Founded 2 bootstrapped startups with successful acquisitions; active angel investor in 18 ventures.',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80'
        },
        priceInPaise: 249900, // ₹2,499
        currency: 'INR',
        venue: {
          type: 'PHYSICAL',
          address: 'Innov8 Coworking, Connaught Place',
          city: 'Delhi'
        },
        deliveryMode: 'IN_PERSON',
        startDateTime: addDays(now, 18),
        endDateTime: addHours(addDays(now, 18), 5),
        registrationDeadline: addDays(now, 17),
        capacity: 20,
        bookedSeats: 20, // Sold out!
        status: 'PUBLISHED',
        skillLevel: 'ALL_LEVELS',
        prerequisites: ['A startup idea or curiosity about venture building'],
        whatYouWillLearn: [
          'Rigorous problem validation frameworks',
          'Unit economics and financial modeling fundamentals',
          'Pitch deck storytelling that resonates with angel investors',
          'Legal structures, founder vesting, and term sheets'
        ]
      },
      {
        title: 'Street & Editorial Photography: Master the Lens',
        category: 'Photography',
        shortDescription: 'Master manual camera controls, natural light sculpting, composition rules, and Adobe Lightroom grading.',
        description: 'Capture evocative visual stories that evoke genuine emotion. We explore aperture, shutter speed, ISO manipulation, framing with natural geometry, street ethics, candid portraiture, and film-emulation color grading.',
        coverImage: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80',
        instructor: {
          name: 'Devansh Kothari',
          title: 'Documentary Photographer & National Geographic Contributor',
          bio: 'Visual artist documenting urban subcultures and historical architecture across Asia and Europe.',
          avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80'
        },
        priceInPaise: 119900, // ₹1,199
        currency: 'INR',
        venue: {
          type: 'PHYSICAL',
          address: 'Cubbon Park Bandstand',
          city: 'Bengaluru'
        },
        deliveryMode: 'IN_PERSON',
        startDateTime: addDays(now, 8),
        endDateTime: addHours(addDays(now, 8), 4),
        registrationDeadline: addDays(now, 7),
        capacity: 15,
        bookedSeats: 5,
        status: 'PUBLISHED',
        skillLevel: 'BEGINNER',
        prerequisites: ['Any DSLR, mirrorless camera, or smartphone with manual mode capability'],
        whatYouWillLearn: [
          'Mastering exposure triangle (Aperture, Shutter Speed, ISO)',
          'Natural lighting, reflections, and shadow play',
          'Composition techniques: leading lines, negative space, and depth',
          'Color grading and RAW workflow in Adobe Lightroom'
        ]
      },
      {
        title: 'The Confident Speaker: Executive Communication & Influence',
        category: 'Personal Development',
        shortDescription: 'Overcome public speaking anxiety, master vocal variety, and deliver keynote presentations with poise.',
        description: 'Communication is the single greatest career multiplier. In this interactive session, you will learn how to overcome stage fright using somatic techniques, structure impromptu speeches with the PREP framework, and command presence in executive meetings.',
        coverImage: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=80',
        instructor: {
          name: 'Siddharth Roy',
          title: 'Executive Voice Coach & 3x TEDx Speaker',
          bio: 'Trained over 2,500 CXOs, founders, and community leaders in high-stakes public speaking.',
          avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=300&q=80'
        },
        priceInPaise: 99900, // ₹999
        currency: 'INR',
        venue: {
          type: 'ONLINE',
          meetingLink: 'https://meet.google.com/speaker-workshop'
        },
        deliveryMode: 'ONLINE',
        startDateTime: addDays(now, 3),
        endDateTime: addHours(addDays(now, 3), 3),
        registrationDeadline: addDays(now, 2),
        capacity: 25,
        bookedSeats: 10,
        status: 'PUBLISHED',
        skillLevel: 'ALL_LEVELS',
        prerequisites: ['Willingness to practice on camera in small breakout groups'],
        whatYouWillLearn: [
          'Somatic breathwork to eliminate speech anxiety',
          'The PREP framework for compelling impromptu answers',
          'Vocal dynamics: pacing, pitch modulation, and strategic pauses',
          'Designing slide decks that amplify speech rather than distract'
        ]
      },
      {
        title: 'Free Workshop: Introduction to Cloud Native with Docker & Kubernetes',
        category: 'Web Development',
        shortDescription: 'Kickstart your containerization journey with Docker fundamentals and container orchestration.',
        description: 'Understand the building blocks of modern DevOps. This free introductory workshop covers containerizing web applications, writing Dockerfiles, multi-stage builds, and running your first Kubernetes pod on a local cluster.',
        coverImage: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?auto=format&fit=crop&w=1200&q=80',
        instructor: {
          name: 'Vikram Sengupta',
          title: 'Principal Software Architect at FinTechScale',
          bio: '14+ years experience building distributed microservices.',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
        },
        priceInPaise: 0, // ₹0 Free workshop
        currency: 'INR',
        venue: {
          type: 'ONLINE',
          meetingLink: 'https://meet.google.com/free-cloud-intro'
        },
        deliveryMode: 'ONLINE',
        startDateTime: addDays(now, 2),
        endDateTime: addHours(addDays(now, 2), 2),
        registrationDeadline: addDays(now, 1),
        capacity: 100,
        bookedSeats: 45,
        status: 'PUBLISHED',
        skillLevel: 'BEGINNER',
        prerequisites: ['Basic command line familiarity'],
        whatYouWillLearn: [
          'Why containers revolutionized modern software deployment',
          'Writing efficient Dockerfiles and caching layers',
          'Running multi-container apps with Docker Compose',
          'Foundational concepts of Kubernetes Pods and Services'
        ]
      }
    ];

    const createdWorkshops = await Workshop.insertMany(sampleWorkshops);
    logger.info(`Inserted ${createdWorkshops.length} rich sample workshops.`);

    // 3. Insert real reviews for several workshops
    const reviewsData = [
      {
        workshop: createdWorkshops[0]._id,
        user: studentUser._id,
        rating: 5,
        comment: 'Hands down the most actionable engineering workshop I have attended this year. Vikram explained atomic MongoDB locks with crystal clarity!'
      },
      {
        workshop: createdWorkshops[0]._id,
        user: studentUser2._id,
        rating: 5,
        comment: 'Super structured and real-world. The payment gateway architecture section was worth 10x the price alone.'
      },
      {
        workshop: createdWorkshops[1]._id,
        user: studentUser._id,
        rating: 5,
        comment: 'Dr. Rohini is brilliant. The live RAG pipeline walkthrough cleared up all my doubts regarding vector index latency.'
      },
      {
        workshop: createdWorkshops[2]._id,
        user: studentUser2._id,
        rating: 4,
        comment: 'Loved the hands-on design tokens segment in Figma! Kavita has immense practical experience with scalable design systems.'
      }
    ];

    await Review.insertMany(reviewsData);
    logger.info('Inserted authentic reviews.');

    logger.info('Database seeding completed successfully!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    logger.error('Database seeding failed:', error.message);
    process.exit(1);
  }
};

seedDatabase();
