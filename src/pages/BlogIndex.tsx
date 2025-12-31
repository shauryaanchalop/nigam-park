import { Link } from 'react-router-dom';
import { GovHeader } from '@/components/ui/GovHeader';
import { SEOHead } from '@/components/SEOHead';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Calendar, Clock, User, ChevronLeft } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';

interface BlogPost {
  slug: string;
  title: string;
  description: string;
  category: string;
  author: string;
  date: string;
  readTime: string;
  image?: string;
}

const blogPosts: BlogPost[] = [
  {
    slug: 'parking-tips-delhi',
    title: '10 Smart Parking Tips for Delhi Drivers',
    description: 'Navigate Delhi\'s busy streets like a pro with these essential parking tips. Learn how to find spots faster, avoid illegal parking, and save money.',
    category: 'Tips & Guides',
    author: 'NIGAM-Park Team',
    date: '2025-01-15',
    readTime: '5 min read',
  },
  {
    slug: 'avoid-parking-fines',
    title: 'How to Avoid Parking Fines in Delhi: Complete Guide',
    description: 'Understand MCD parking rules, fine amounts, and how to dispute unfair challan. Stay informed and avoid unnecessary penalties.',
    category: 'Legal & Compliance',
    author: 'NIGAM-Park Team',
    date: '2025-01-10',
    readTime: '7 min read',
  },
  {
    slug: 'smart-parking-benefits',
    title: 'Why Smart Parking is the Future of Delhi',
    description: 'Discover how digital parking solutions are reducing traffic congestion, improving air quality, and making Delhi a smarter city.',
    category: 'Technology',
    author: 'NIGAM-Park Team',
    date: '2025-01-05',
    readTime: '4 min read',
  },
];

export default function BlogIndex() {
  const { isHindi } = useLanguage();
  
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'NIGAM-Park Blog',
    description: 'Parking tips, guides, and news for Delhi drivers',
    url: 'https://nigam-park.vercel.app/blog',
    publisher: {
      '@type': 'Organization',
      name: 'NIGAM-Park',
      logo: 'https://nigam-park.vercel.app/favicon.png',
    },
    blogPost: blogPosts.map(post => ({
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.description,
      datePublished: post.date,
      author: {
        '@type': 'Organization',
        name: post.author,
      },
      url: `https://nigam-park.vercel.app/blog/${post.slug}`,
    })),
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Parking Tips & Guides Blog"
        description="Expert parking tips, Delhi traffic guides, and smart parking news. Learn how to find parking faster, avoid fines, and save money in Delhi."
        keywords="Delhi parking tips, parking guide Delhi, avoid parking fines, smart parking, MCD parking rules, parking challan"
        canonicalUrl="https://nigam-park.vercel.app/blog"
        structuredData={structuredData}
      />
      
      <GovHeader />
      
      <main className="container py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Button variant="ghost" asChild className="mb-4">
            <Link to="/citizen">
              <ChevronLeft className="w-4 h-4 mr-1" />
              {isHindi ? 'वापस जाएं' : 'Back'}
            </Link>
          </Button>

          <div className="mb-8">
            <Badge variant="outline" className="mb-2">{isHindi ? 'ब्लॉग' : 'Blog'}</Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              {isHindi ? 'पार्किंग टिप्स और गाइड' : 'Parking Tips & Guides'}
            </h1>
            <p className="text-lg text-muted-foreground">
              {isHindi ? 'दिल्ली में पार्किंग, ट्रैफिक नियमों और स्मार्ट पार्किंग तकनीक के बारे में विशेषज्ञ सलाह।' : 'Expert advice on parking in Delhi, traffic rules, and smart parking technology.'}
            </p>
          </div>
          
          <div className="grid gap-6">
            {blogPosts.map((post, index) => (
              <Card key={post.slug} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">{post.category}</Badge>
                    {index === 0 && <Badge className="bg-primary">Latest</Badge>}
                  </div>
                  <CardTitle className="text-xl md:text-2xl">
                    <Link to={`/blog/${post.slug}`} className="hover:text-primary transition-colors">
                      {post.title}
                    </Link>
                  </CardTitle>
                  <CardDescription className="text-base">
                    {post.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {post.author}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(post.date).toLocaleDateString('en-IN', { 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {post.readTime}
                    </div>
                  </div>
                  <Link to={`/blog/${post.slug}`}>
                    <Button variant="outline" size="sm">
                      {isHindi ? 'लेख पढ़ें' : 'Read Article'}
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
