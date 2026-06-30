import express from 'express';
import mongoose from 'mongoose';
import KeynoteSpeaker from '../models/KeynoteSpeaker.js';
import { verifyJWT, adminMiddleware } from '../middleware/auth.js';
import { uploadImage } from '../middleware/upload.js';
import cloudinary from '../config/cloudinary.js';
import streamifier from 'streamifier';
import { cacheMiddleware, invalidateEntityCache } from '../middleware/cache.js';

const router = express.Router();

// PUBLIC ROUTES

// Get all active keynote speakers
router.get('/', cacheMiddleware(3600), async (req, res) => {
    try {
        const startTime = Date.now();
        
        // Seed database if empty
        const count = await KeynoteSpeaker.countDocuments();
        if (count === 0) {
            const initialSpeakers = [
                {
                    name: "Mahmoud Shafik",
                    title: "BEng (Hons) MSc PhD CEng FHEA MIET MASME",
                    institution: "Professor/Senior Lead Academic in Intelligent Systems and Digital Technology • University of Derby, United Kingdom",
                    image: "/src/components/images/speaker/n.png",
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
                    image: "/src/components/images/new/kazuo4.jpeg",
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
                    image: "/src/components/images/new/dugki.jpg",
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
                    image: "/src/components/images/new/zou.gif",
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
            await KeynoteSpeaker.insertMany(initialSpeakers);
            console.log('Seeded initial keynote speakers');
        }

        const query = { active: true };

        console.log('🔍 KeynoteSpeaker query:', query, 'DB state:', mongoose.connection.readyState);

        const speakers = await KeynoteSpeaker.find(query)
            .sort({ order: 1, createdAt: 1 })
            .lean()
            .maxTimeMS(60000);

        const duration = Date.now() - startTime;
        console.log(`KeynoteSpeaker query completed in ${duration}ms, found ${speakers.length} speakers`);

        res.json({
            success: true,
            count: speakers.length,
            speakers
        });
    } catch (error) {
        console.error('Error fetching keynote speakers:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch keynote speakers',
            error: error.message
        });
    }
});

// Get single speaker by ID
router.get('/:id', cacheMiddleware(3600), async (req, res) => {
    try {
        const speaker = await KeynoteSpeaker.findById(req.params.id).lean();

        if (!speaker) {
            return res.status(404).json({
                success: false,
                message: 'Keynote speaker not found'
            });
        }

        res.json({
            success: true,
            speaker
        });
    } catch (error) {
        console.error('Error fetching speaker:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch speaker',
            error: error.message
        });
    }
});

// ADMIN ROUTES

// Get all keynote speakers (including inactive) - Admin only
router.get('/admin/all', verifyJWT, adminMiddleware, cacheMiddleware(300), async (req, res) => {
    try {
        // Seed database if empty
        const count = await KeynoteSpeaker.countDocuments();
        if (count === 0) {
            const initialSpeakers = [
                {
                    name: "Mahmoud Shafik",
                    title: "BEng (Hons) MSc PhD CEng FHEA MIET MASME",
                    institution: "Professor/Senior Lead Academic in Intelligent Systems and Digital Technology • University of Derby, United Kingdom",
                    image: "/src/components/images/speaker/n.png",
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
                    image: "/src/components/images/new/kazuo4.jpeg",
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
                    image: "/src/components/images/new/dugki.jpg",
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
                    image: "/src/components/images/new/zou.gif",
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
            await KeynoteSpeaker.insertMany(initialSpeakers);
            console.log('Seeded initial keynote speakers');
        }

        const speakers = await KeynoteSpeaker.find().sort({ order: 1, createdAt: 1 }).lean().maxTimeMS(30000);

        res.json({
            success: true,
            count: speakers.length,
            speakers
        });
    } catch (error) {
        console.error('Error fetching all speakers:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch speakers',
            error: error.message
        });
    }
});

// Create new keynote speaker - Admin only
router.post('/', verifyJWT, adminMiddleware, uploadImage.single('image'), async (req, res) => {
    try {
        const {
            name,
            title,
            institution,
            email,
            facultyProfile,
            linkedIn,
            orcid,
            biography,
            expertise,
            keynoteTitle,
            keynoteDescription,
            order,
            active
        } = req.body;

        // Validation
        if (!name || !institution || !biography || !keynoteTitle || !keynoteDescription) {
            return res.status(400).json({
                success: false,
                message: 'Name, institution, biography, keynoteTitle, and keynoteDescription are required'
            });
        }

        let imageUrl = '';
        if (req.file) {
            // Upload to Cloudinary from buffer
            const uploadPromise = new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { folder: 'speakers' },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result.secure_url);
                    }
                );
                streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
            });
            imageUrl = await uploadPromise;
        }

        let parsedExpertise = [];
        if (expertise) {
            try {
                parsedExpertise = typeof expertise === 'string' ? JSON.parse(expertise) : expertise;
            } catch (e) {
                // If it's a comma-separated list or simple string
                parsedExpertise = typeof expertise === 'string' ? expertise.split(',').map(s => s.trim()) : [];
            }
        }

        const newSpeaker = new KeynoteSpeaker({
            name,
            title,
            institution,
            image: imageUrl || undefined,
            email,
            facultyProfile,
            linkedIn,
            orcid,
            biography,
            expertise: parsedExpertise,
            keynoteTitle,
            keynoteDescription,
            order: order || 0,
            active: active !== undefined ? active : true
        });

        await newSpeaker.save();

        // Invalidate speakers cache
        await invalidateEntityCache('speakers');

        console.log('KeynoteSpeaker created:', newSpeaker.name);

        res.status(201).json({
            success: true,
            message: 'Keynote speaker created successfully',
            speaker: newSpeaker
        });
    } catch (error) {
        console.error('Error creating speaker:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create speaker',
            error: error.message
        });
    }
});

// Update speaker - Admin only
router.put('/:id', verifyJWT, adminMiddleware, uploadImage.single('image'), async (req, res) => {
    try {
        const {
            name,
            title,
            institution,
            email,
            facultyProfile,
            linkedIn,
            orcid,
            biography,
            expertise,
            keynoteTitle,
            keynoteDescription,
            order,
            active
        } = req.body;

        const speaker = await KeynoteSpeaker.findById(req.params.id);

        if (!speaker) {
            return res.status(404).json({
                success: false,
                message: 'Speaker not found'
            });
        }

        // Handle image upload if provided
        if (req.file) {
            const uploadPromise = new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { folder: 'speakers' },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result.secure_url);
                    }
                );
                streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
            });
            speaker.image = await uploadPromise;
        }

        // Update fields
        if (name) speaker.name = name;
        if (title !== undefined) speaker.title = title;
        if (institution) speaker.institution = institution;
        if (email !== undefined) speaker.email = email;
        if (facultyProfile !== undefined) speaker.facultyProfile = facultyProfile;
        if (linkedIn !== undefined) speaker.linkedIn = linkedIn;
        if (orcid !== undefined) speaker.orcid = orcid;
        if (biography) speaker.biography = biography;
        if (keynoteTitle) speaker.keynoteTitle = keynoteTitle;
        if (keynoteDescription) speaker.keynoteDescription = keynoteDescription;
        if (order !== undefined) speaker.order = order;
        if (active !== undefined) speaker.active = active;

        if (expertise !== undefined) {
            try {
                speaker.expertise = typeof expertise === 'string' ? JSON.parse(expertise) : expertise;
            } catch (e) {
                speaker.expertise = typeof expertise === 'string' ? expertise.split(',').map(s => s.trim()) : [];
            }
        }

        await speaker.save();

        // Invalidate speakers cache
        await invalidateEntityCache('speakers');

        console.log('KeynoteSpeaker updated:', speaker.name);

        res.json({
            success: true,
            message: 'Keynote speaker updated successfully',
            speaker
        });
    } catch (error) {
        console.error('Error updating speaker:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update speaker',
            error: error.message
        });
    }
});

// Delete speaker - Admin only
router.delete('/:id', verifyJWT, adminMiddleware, async (req, res) => {
    try {
        const speaker = await KeynoteSpeaker.findByIdAndDelete(req.params.id).lean();

        if (!speaker) {
            return res.status(404).json({
                success: false,
                message: 'Speaker not found'
            });
        }

        // Invalidate speakers cache
        await invalidateEntityCache('speakers');

        console.log('KeynoteSpeaker deleted:', speaker.name);

        res.json({
            success: true,
            message: 'Keynote speaker deleted successfully',
            speaker
        });
    } catch (error) {
        console.error('Error deleting speaker:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete speaker',
            error: error.message
        });
    }
});

// Toggle active status - Admin only
router.patch('/:id/toggle-active', verifyJWT, adminMiddleware, async (req, res) => {
    try {
        const speaker = await KeynoteSpeaker.findById(req.params.id);

        if (!speaker) {
            return res.status(404).json({
                success: false,
                message: 'Speaker not found'
            });
        }

        speaker.active = !speaker.active;
        await speaker.save();

        // Invalidate speakers cache
        await invalidateEntityCache('speakers');

        console.log(`KeynoteSpeaker ${speaker.active ? 'activated' : 'deactivated'}:`, speaker.name);

        res.json({
            success: true,
            message: `Keynote speaker ${speaker.active ? 'activated' : 'deactivated'} successfully`,
            speaker
        });
    } catch (error) {
        console.error('Error toggling speaker status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle speaker status',
            error: error.message
        });
    }
});

// Bulk reorder speakers - Admin only
router.post('/reorder', verifyJWT, adminMiddleware, async (req, res) => {
    try {
        const { orders } = req.body; // Array of { id: string, order: number }

        if (!orders || !Array.isArray(orders)) {
            return res.status(400).json({
                success: false,
                message: 'Orders array is required'
            });
        }

        // Bulk update operations
        const bulkOps = orders.map(({ id, order }) => ({
            updateOne: {
                filter: { _id: id },
                update: { $set: { order } }
            }
        }));

        await KeynoteSpeaker.bulkWrite(bulkOps);

        // Invalidate speakers cache
        await invalidateEntityCache('speakers');

        console.log('KeynoteSpeaker members reordered:', orders.length, 'speakers');

        res.json({
            success: true,
            message: 'Keynote speakers reordered successfully'
        });
    } catch (error) {
        console.error('Error reordering speakers:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reorder speakers',
            error: error.message
        });
    }
});

export default router;
