import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import KeynoteSpeaker from './models/KeynoteSpeaker.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

const speakersData = [
    {
        name: "Mahmoud Shafik",
        title: "BEng (Hons) MSc PhD CEng FHEA MIET MASME",
        institution: "Professor/Senior Lead Academic in Intelligent Systems and Digital Technology • University of Derby, United Kingdom",
        localImagePath: "../srm-front2/src/components/images/speaker/n.png",
        email: "mshafik@derby.ac.uk",
        facultyProfile: "https://www.derby.ac.uk/staff/mahmoud-shafik/",
        linkedIn: "https://www.linkedin.com/in/mahmoud-shafik-ph-d-0602377/",
        orcid: "0000-0001-8296-5698",
        biography: "Professor Mahmoud Shafik is an internationally recognized scholar in Intelligent Systems and Digital Technology at the University of Derby. He has made personal distinctions for his contributions in Intelligent Mechatronics Systems and Digital Technology with more than 20 years of industrial applied research experience. His work spans Intelligent Systems, Industry 4.0, Artificial Intelligence (AI), Internet of Things (IoT), autonomous vehicle technologies, robotic systems, machine vision, sensors and actuators, automation, telehealth, renewable energy systems, and sustainable engineering technologies. He has successfully led and delivered several European Commission FP5, FP6, FP7 and Horizon projects with major industrial and societal impact across the UK and Europe.",
        expertise: [
            "Intelligent Systems", "Digital Technology", "Industry 4.0", "Artificial Intelligence",
            "Internet of Things (IoT)", "Robotic Systems and Automation", "Machine Vision",
            "3D Smart Sensors and Actuators", "Autonomous Vehicle Systems", "Telehealth and Telecare",
            "Renewable Energy Systems", "Sustainable Engineering"
        ],
        keynoteTitle: "Intelligent Systems and Digital Technology for Sustainable Engineering",
        keynoteDescription: "The keynote discusses emerging intelligent technologies in automation, robotics, Industry 4.0, and digital transformation for sustainable engineering applications and industrial innovation.",
        order: 0,
        active: true
    },
    {
        name: "Kazuo Ishii",
        title: "Dr. Eng., Professor",
        institution: "Center for Socio-Robotic Synthesis • Kyushu Institute of Technology, Japan",
        localImagePath: "../srm-front2/src/components/images/new/kazuo4.jpeg",
        email: "",
        facultyProfile: "https://hyokadb02.jimu.kyutech.ac.jp/html/353_en.html",
        linkedIn: "",
        orcid: "",
        biography: "Professor Kazuo Ishii is a Professor at the Kyushu Institute of Technology, Japan, and a leading researcher in robotics, underwater robotics, autonomous systems, agricultural robotics, and socio-robotic systems. He completed his doctoral studies at the University of Tokyo and has served as a visiting researcher at Fraunhofer AIS, Germany. His recent research includes underwater vehicles, tomato-harvesting robots, smart agriculture systems, robotic sensing, ultrasonic systems, underwater communication, aquaculture technologies, and intelligent robotic motion control.",
        expertise: [
            "Robotics", "Underwater Robotics", "Autonomous Underwater Vehicles", "Smart Agriculture",
            "Agricultural Robotics", "Robot Motion Control", "Ultrasonic Systems", "Aquaculture Technologies",
            "Sensor Systems", "Socio-Robotic Systems", "Marine Robotics", "Intelligent Robotic Systems"
        ],
        keynoteTitle: "Advanced Underwater Robotics for Smart Society",
        keynoteDescription: "This keynote explores recent advances in underwater robotics, smart agriculture robots, autonomous robotic systems, and intelligent sensing technologies for future smart society applications.",
        order: 1,
        active: true
    },
    {
        name: "Prof. Dugki Min*",
        title: "Professor (Under Confirmation)",
        institution: "Department of Computer Science and Engineering • Konkuk University, South Korea",
        localImagePath: "../srm-front2/src/components/images/new/dugki.jpg",
        email: "dkmin@konkuk.ac.kr",
        facultyProfile: "https://dms.konkuk.ac.kr/people/DugkiMin/",
        linkedIn: "",
        orcid: "",
        biography: "Professor Dugki Min is a Full Professor in the Department of Computer Science and Engineering at Konkuk University, South Korea. He received his Ph.D. in Computer Science and Engineering from Michigan State University. His research focuses on Distributed Systems, Artificial Intelligence, Deep Reinforcement Learning, Software Architecture, Cloud Computing, Mobile Cloud Computing, Virtualization, Web Services, and Multimedia Distributed Systems. He currently leads the Multimedia Distributed Systems Laboratory and has served in multiple academic leadership roles including Chairman of the Department of Artificial Intelligence at Konkuk University.",
        expertise: [
            "Distributed Systems", "Artificial Intelligence", "Deep Reinforcement Learning", "Software Architecture",
            "Cloud Computing", "Mobile Cloud Computing", "Virtualization", "Web Services",
            "Multimedia Distributed Systems", "Parallel and Distributed Computing", "System Architecture",
            "AI Systems"
        ],
        keynoteTitle: "Distributed AI and Cloud-Based Intelligent Computing Systems",
        keynoteDescription: "The keynote presents recent developments in distributed AI systems, intelligent cloud computing, software architecture, and scalable computing technologies for next-generation digital systems.",
        order: 2,
        active: true
    },
    {
        name: "Yao Zou",
        title: "Professor",
        institution: "University of Science and Technology Beijing • China",
        localImagePath: "../srm-front2/src/components/images/new/zou.gif",
        email: "",
        facultyProfile: "https://ieeexplore.ieee.org/author/37086156767",
        linkedIn: "",
        orcid: "",
        biography: "Professor Yao Zou is an active researcher and IEEE author with contributions in intelligent control systems, robotics, autonomous systems, and advanced engineering technologies. His research publications focus on intelligent automation, control engineering, robotics applications, and next-generation smart systems. He has contributed to several international research publications indexed by IEEE and related scientific platforms.",
        expertise: [
            "Intelligent Control Systems", "Robotics", "Autonomous Systems", "Control Engineering",
            "Automation", "Smart Systems", "Artificial Intelligence", "Engineering Technologies"
        ],
        keynoteTitle: "Intelligent Control and Automation for Future Engineering Systems",
        keynoteDescription: "This keynote discusses emerging research trends in intelligent control systems, automation technologies, robotics, and AI-driven engineering applications.",
        order: 3,
        active: true
    }
];

const seed = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB.');

        // Clean out existing keynote speakers
        console.log('Cleaning up existing keynote speakers...');
        await KeynoteSpeaker.deleteMany({});
        console.log('Cleanup complete.');

        for (const data of speakersData) {
            console.log(`Processing speaker: ${data.name}`);
            let imageUrl = '';
            
            const resolvedPath = path.resolve(__dirname, data.localImagePath);
            if (fs.existsSync(resolvedPath)) {
                console.log(`Uploading local image to Cloudinary: ${resolvedPath}`);
                const uploadResult = await cloudinary.uploader.upload(resolvedPath, {
                    folder: 'speakers'
                });
                imageUrl = uploadResult.secure_url;
                console.log(`Uploaded! Cloudinary URL: ${imageUrl}`);
            } else {
                console.warn(`Warning: Image file not found at ${resolvedPath}. Using default avatar.`);
                imageUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=F5A051&color=fff&size=300`;
            }

            const speaker = new KeynoteSpeaker({
                name: data.name,
                title: data.title,
                institution: data.institution,
                image: imageUrl,
                email: data.email,
                facultyProfile: data.facultyProfile,
                linkedIn: data.linkedIn,
                orcid: data.orcid,
                biography: data.biography,
                expertise: data.expertise,
                keynoteTitle: data.keynoteTitle,
                keynoteDescription: data.keynoteDescription,
                order: data.order,
                active: data.active
            });

            await speaker.save();
            console.log(`Saved speaker ${data.name} to DB successfully.`);
        }

        console.log('🎉 Seeding completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Error seeding keynote speakers:', err);
        process.exit(1);
    }
};

seed();
