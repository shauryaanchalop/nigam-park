import { useParams, Link } from 'react-router-dom';
import { GovHeader } from '@/components/ui/GovHeader';
import { SEOHead } from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Calendar, Clock, User, Share2, MapPin } from 'lucide-react';
import { toast } from 'sonner';

interface BlogArticle {
  slug: string;
  title: string;
  description: string;
  metaDescription: string;
  keywords: string;
  category: string;
  author: string;
  date: string;
  readTime: string;
  content: React.ReactNode;
}

const articles: Record<string, BlogArticle> = {
  'parking-tips-delhi': {
    slug: 'parking-tips-delhi',
    title: '10 Smart Parking Tips for Delhi Drivers',
    description: 'Navigate Delhi\'s busy streets like a pro with these essential parking tips.',
    metaDescription: 'Essential parking tips for Delhi drivers. Learn how to find parking spots faster, use NIGAM-Park app, avoid illegal parking zones, and save money on parking fees.',
    keywords: 'Delhi parking tips, find parking Delhi, smart parking tips, parking spots Delhi, avoid parking fine Delhi',
    category: 'Tips & Guides',
    author: 'NIGAM-Park Team',
    date: '2025-01-15',
    readTime: '5 min read',
    content: (
      <div className="prose prose-lg max-w-none">
        <p className="lead">
          Finding parking in Delhi can be challenging, especially during peak hours. Here are 10 smart tips to help you park efficiently and avoid stress.
        </p>
        
        <h2>1. Use the NIGAM-Park App</h2>
        <p>
          The easiest way to find parking in Delhi is through the NIGAM-Park app. Get real-time availability updates, reserve spots in advance, and pay digitally. No more circling blocks looking for parking!
        </p>
        
        <h2>2. Book in Advance for Popular Areas</h2>
        <p>
          Planning to visit Connaught Place, Sarojini Nagar, or Chandni Chowk? Book your parking spot at least 30 minutes in advance. Weekend reservations for shopping areas should be made even earlier.
        </p>
        
        <h2>3. Know Peak Hours</h2>
        <ul>
          <li><strong>Morning Rush:</strong> 9 AM - 11 AM (office areas)</li>
          <li><strong>Afternoon Peak:</strong> 12 PM - 2 PM (markets)</li>
          <li><strong>Evening Rush:</strong> 5 PM - 8 PM (everywhere)</li>
        </ul>
        <p>Try to arrive before or after these windows for easier parking.</p>
        
        <h2>4. Check Alternative Lots</h2>
        <p>
          If your preferred lot is full, check nearby alternatives. A 5-minute walk can save you 30 minutes of waiting. The NIGAM-Park app shows all nearby lots with availability.
        </p>
        
        <h2>5. Use Multi-Level Parking</h2>
        <p>
          Delhi has several multi-level parking facilities that are often less crowded than surface lots. They also offer shade and security.
        </p>
        
        <h2>6. Set Reminders for Expiry</h2>
        <p>
          Enable notifications in NIGAM-Park to get alerts before your parking time expires. This helps avoid overstay fines which can be substantial.
        </p>
        
        <h2>7. Keep Digital Payment Ready</h2>
        <p>
          Most MCD parking lots now accept UPI payments. Keep your payment app ready to save time at entry and exit.
        </p>
        
        <h2>8. Avoid No-Parking Zones</h2>
        <p>
          Yellow lines and No Parking signs mean exactly that. Traffic police actively tow vehicles, and getting your car back involves significant hassle and fees.
        </p>
        
        <h2>9. Use Metro + Park Facilities</h2>
        <p>
          Many metro stations have dedicated parking. Consider parking at a less crowded station and taking the metro to central areas.
        </p>
        
        <h2>10. Join the Loyalty Program</h2>
        <p>
          Regular parkers can earn points and discounts through NIGAM-Park&apos;s loyalty program. The more you park, the more you save!
        </p>
        
        <div className="bg-primary/10 p-6 rounded-lg mt-8">
          <h3 className="text-primary mt-0">Ready to Park Smarter?</h3>
          <p className="mb-0">
            Start using NIGAM-Park today for hassle-free parking across Delhi. Real-time availability, easy reservations, and digital payments.
          </p>
        </div>
      </div>
    ),
  },
  'avoid-parking-fines': {
    slug: 'avoid-parking-fines',
    title: 'How to Avoid Parking Fines in Delhi: Complete Guide',
    description: 'Understand MCD parking rules, fine amounts, and how to dispute unfair challan.',
    metaDescription: 'Complete guide to avoiding parking fines in Delhi. Know MCD parking rules, fine amounts, legal parking zones, and how to dispute unfair challan tickets.',
    keywords: 'parking fine Delhi, avoid challan, MCD parking rules, parking violation Delhi, dispute parking ticket',
    category: 'Legal & Compliance',
    author: 'NIGAM-Park Team',
    date: '2025-01-10',
    readTime: '7 min read',
    content: (
      <div className="prose prose-lg max-w-none">
        <p className="lead">
          Parking fines in Delhi can range from ₹500 to ₹5,000 depending on the violation. Understanding the rules can save you significant money and hassle.
        </p>
        
        <h2>Common Parking Violations and Fines</h2>
        <table>
          <thead>
            <tr>
              <th>Violation</th>
              <th>Fine Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>No Parking Zone</td>
              <td>₹1,000 - ₹2,000</td>
            </tr>
            <tr>
              <td>Overstay in Paid Parking</td>
              <td>₹500 - ₹1,000</td>
            </tr>
            <tr>
              <td>Blocking Traffic</td>
              <td>₹2,000 - ₹5,000</td>
            </tr>
            <tr>
              <td>Parking on Footpath</td>
              <td>₹1,000</td>
            </tr>
            <tr>
              <td>Double Parking</td>
              <td>₹1,500</td>
            </tr>
          </tbody>
        </table>
        
        <h2>How to Identify Legal Parking Zones</h2>
        <ul>
          <li><strong>Blue P Signs:</strong> Indicate paid parking areas</li>
          <li><strong>White Lines:</strong> Designated parking spots</li>
          <li><strong>Yellow Lines:</strong> No parking (continuous) / No stopping (broken)</li>
          <li><strong>MCD Boards:</strong> Display rates and timings</li>
        </ul>
        
        <h2>Tips to Avoid Fines</h2>
        <ol>
          <li>Always use authorized MCD parking lots</li>
          <li>Keep your parking receipt visible on dashboard</li>
          <li>Set alarms for parking expiry</li>
          <li>Take photos of your parked car with visible signage</li>
          <li>Use NIGAM-Park app for automatic notifications</li>
        </ol>
        
        <h2>What to Do If You Get a Challan</h2>
        <p>
          If you receive a parking challan:
        </p>
        <ol>
          <li>Check the details - date, time, location, and vehicle number</li>
          <li>If incorrect, gather evidence (photos, receipts)</li>
          <li>Visit the traffic police website to pay or dispute</li>
          <li>For disputes, file online with supporting documents</li>
        </ol>
        
        <h2>Disputing an Unfair Fine</h2>
        <p>
          You can dispute a parking fine if:
        </p>
        <ul>
          <li>You have a valid parking receipt for that time</li>
          <li>The signage was unclear or missing</li>
          <li>Your vehicle was parked legally but wrongly ticketed</li>
          <li>The challan has incorrect information</li>
        </ul>
        
        <div className="bg-warning/10 border border-warning/30 p-6 rounded-lg mt-8">
          <h3 className="text-warning mt-0">⚠️ Important</h3>
          <p className="mb-0">
            Unpaid parking fines can result in your vehicle being towed or impounded. Always address challans promptly.
          </p>
        </div>
      </div>
    ),
  },
  'smart-parking-benefits': {
    slug: 'smart-parking-benefits',
    title: 'Why Smart Parking is the Future of Delhi',
    description: 'Discover how digital parking solutions are reducing traffic congestion and improving air quality.',
    metaDescription: 'Learn how smart parking technology is transforming Delhi. Reduce traffic congestion, lower pollution, save time, and modernize urban infrastructure with digital parking solutions.',
    keywords: 'smart parking Delhi, digital parking, reduce traffic congestion, improve air quality Delhi, smart city Delhi',
    category: 'Technology',
    author: 'NIGAM-Park Team',
    date: '2025-01-05',
    readTime: '4 min read',
    content: (
      <div className="prose prose-lg max-w-none">
        <p className="lead">
          Studies show that 30% of urban traffic is caused by drivers searching for parking. Smart parking solutions like NIGAM-Park are changing this.
        </p>
        
        <h2>The Problem with Traditional Parking</h2>
        <ul>
          <li>Drivers spend 20+ minutes searching for spots</li>
          <li>Circling vehicles increase traffic congestion</li>
          <li>Idling engines contribute to air pollution</li>
          <li>Cash-based systems are inefficient and prone to leakage</li>
          <li>No data for urban planning decisions</li>
        </ul>
        
        <h2>How Smart Parking Helps</h2>
        
        <h3>1. Reduces Traffic Congestion</h3>
        <p>
          Real-time availability information means drivers go directly to available spots instead of circling. This can reduce parking-related traffic by up to 40%.
        </p>
        
        <h3>2. Improves Air Quality</h3>
        <p>
          Less vehicle idling means fewer emissions. Each minute of idling produces 4.6 grams of CO2. Multiply that by millions of vehicles and the impact is significant.
        </p>
        
        <h3>3. Saves Time and Money</h3>
        <p>
          Pre-booking and real-time updates save the average driver 15-20 minutes per trip. That&apos;s hours saved every month.
        </p>
        
        <h3>4. Increases Revenue Transparency</h3>
        <p>
          Digital payments eliminate cash handling issues and ensure every transaction is recorded. This increases municipal revenue and accountability.
        </p>
        
        <h3>5. Provides Data for Better Planning</h3>
        <p>
          Usage patterns help city planners make informed decisions about where to build new parking facilities and how to price them effectively.
        </p>
        
        <h2>Delhi&apos;s Smart City Vision</h2>
        <p>
          NIGAM-Park is part of Delhi&apos;s broader smart city initiative. By digitizing parking, we&apos;re not just solving a daily inconvenience—we&apos;re contributing to:
        </p>
        <ul>
          <li>Cleaner air for all residents</li>
          <li>More efficient use of public space</li>
          <li>Better quality of life</li>
          <li>A model for other Indian cities</li>
        </ul>
        
        <div className="bg-success/10 border border-success/30 p-6 rounded-lg mt-8">
          <h3 className="text-success mt-0">🌱 Environmental Impact</h3>
          <p className="mb-0">
            Every smart parking transaction helps reduce Delhi&apos;s carbon footprint. Together, we can make a difference for our city&apos;s air quality.
          </p>
        </div>
      </div>
    ),
  },
};

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const article = slug ? articles[slug] : null;
  
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article?.title,
          text: article?.description,
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };
  
  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        <GovHeader />
        <main className="container py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
          <p className="text-muted-foreground mb-4">The article you&apos;re looking for doesn&apos;t exist.</p>
          <Link to="/blog">
            <Button>Back to Blog</Button>
          </Link>
        </main>
      </div>
    );
  }
  
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    description: article.metaDescription,
    datePublished: article.date,
    dateModified: article.date,
    author: {
      '@type': 'Organization',
      name: article.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'NIGAM-Park',
      logo: {
        '@type': 'ImageObject',
        url: 'https://nigam-park.vercel.app/favicon.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://nigam-park.vercel.app/blog/${article.slug}`,
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={article.title}
        description={article.metaDescription}
        keywords={article.keywords}
        canonicalUrl={`https://nigam-park.vercel.app/blog/${article.slug}`}
        ogType="article"
        structuredData={structuredData}
      />
      
      <GovHeader />
      
      <main className="container py-8">
        <article className="max-w-3xl mx-auto">
          <Link to="/blog">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Blog
            </Button>
          </Link>
          
          <header className="mb-8">
            <Badge variant="secondary" className="mb-3">{article.category}</Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{article.title}</h1>
            <p className="text-xl text-muted-foreground mb-4">{article.description}</p>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {article.author}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(article.date).toLocaleDateString('en-IN', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {article.readTime}
              </div>
              <Button variant="ghost" size="sm" onClick={handleShare} className="ml-auto">
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </Button>
            </div>
          </header>
          
          <div className="border-t pt-8">
            {article.content}
          </div>
          
          {/* Related Links */}
          <Card className="mt-12">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Find Parking Near You
              </h3>
              <div className="flex flex-wrap gap-2">
                <Link to="/parking/connaught-place">
                  <Button variant="outline" size="sm">Connaught Place</Button>
                </Link>
                <Link to="/parking/karol-bagh">
                  <Button variant="outline" size="sm">Karol Bagh</Button>
                </Link>
                <Link to="/parking/chandni-chowk">
                  <Button variant="outline" size="sm">Chandni Chowk</Button>
                </Link>
                <Link to="/parking/lajpat-nagar">
                  <Button variant="outline" size="sm">Lajpat Nagar</Button>
                </Link>
                <Link to="/citizen">
                  <Button size="sm">View All Lots</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </article>
      </main>
    </div>
  );
}
