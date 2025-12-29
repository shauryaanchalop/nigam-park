import React from 'react';
import { Users, Code, Brain, Server, Award, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useLanguage } from '@/contexts/LanguageContext';
import { Separator } from '@/components/ui/separator';

interface TeamMember {
  name: string;
  role: string;
  roleHi: string;
  affiliation: string;
  affiliationHi: string;
  icon: React.ReactNode;
  initials: string;
  color: string;
}

const teamMembers: TeamMember[] = [
  {
    name: 'Shaurya Anchal',
    role: 'Team Leader + Web Development',
    roleHi: 'टीम लीडर + वेब डेवलपमेंट',
    affiliation: 'Lead Developer',
    affiliationHi: 'लीड डेवलपर',
    icon: <Award className="w-4 h-4" />,
    initials: 'SA',
    color: 'bg-primary',
  },
  {
    name: 'Gaurav Bansal',
    role: 'Web Development',
    roleHi: 'वेब डेवलपमेंट',
    affiliation: 'Frontend Developer',
    affiliationHi: 'फ्रंटएंड डेवलपर',
    icon: <Code className="w-4 h-4" />,
    initials: 'GB',
    color: 'bg-blue-500',
  },
  {
    name: 'Shivam Kaushik',
    role: 'AI/ML',
    roleHi: 'एआई/एमएल',
    affiliation: 'ML Engineer',
    affiliationHi: 'एमएल इंजीनियर',
    icon: <Brain className="w-4 h-4" />,
    initials: 'SK',
    color: 'bg-purple-500',
  },
  {
    name: 'Manan Goel',
    role: 'AI/ML',
    roleHi: 'एआई/एमएल',
    affiliation: 'AI Specialist',
    affiliationHi: 'एआई स्पेशलिस्ट',
    icon: <Brain className="w-4 h-4" />,
    initials: 'MG',
    color: 'bg-pink-500',
  },
  {
    name: 'Tanuj Goyal',
    role: 'Web Development + DevOps',
    roleHi: 'वेब डेवलपमेंट + डेवऑप्स',
    affiliation: 'Full Stack & DevOps',
    affiliationHi: 'फुल स्टैक और डेवऑप्स',
    icon: <Server className="w-4 h-4" />,
    initials: 'TG',
    color: 'bg-green-500',
  },
];

interface TeamDialogProps {
  trigger?: React.ReactNode;
  className?: string;
}

export function TeamDialog({ trigger, className }: TeamDialogProps) {
  const { isHindi } = useLanguage();

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className={className}>
            <Users className="w-4 h-4 mr-2" />
            {isHindi ? 'हमारी टीम' : 'Our Team'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Users className="w-6 h-6 text-primary" />
            {isHindi ? 'हमारी टीम से मिलें' : 'Meet Our Team'}
          </DialogTitle>
        </DialogHeader>

        {/* Hackathon Badge */}
        <div className="bg-gradient-to-r from-primary/10 to-success/10 border border-primary/20 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/20">
              <Award className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">
                {isHindi ? 'Hack4Delhi हैकाथॉन' : 'Hack4Delhi Hackathon'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isHindi 
                  ? 'यह प्रोजेक्ट Hack4Delhi हैकाथॉन के लिए बनाया गया है - दिल्ली के लिए स्मार्ट पार्किंग समाधान'
                  : 'This project is built for the Hack4Delhi Hackathon - Smart Parking Solution for Delhi'}
              </p>
            </div>
          </div>
        </div>

        <Separator className="my-2" />

        {/* Team Members Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          {teamMembers.map((member, index) => (
            <div
              key={member.name}
              className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <Avatar className={`w-14 h-14 ${member.color} text-white`}>
                <AvatarFallback className={`${member.color} text-white font-bold text-lg`}>
                  {member.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-base flex items-center gap-2">
                  {member.name}
                  {index === 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {isHindi ? 'लीडर' : 'Leader'}
                    </Badge>
                  )}
                </h4>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  {member.icon}
                  {isHindi ? member.roleHi : member.role}
                </p>
                <Badge variant="outline" className="mt-2 text-xs">
                  {isHindi ? member.affiliationHi : member.affiliation}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {/* Project Info */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Code className="w-4 h-4" />
            {isHindi ? 'प्रोजेक्ट के बारे में' : 'About the Project'}
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {isHindi 
              ? 'NIGAM-Park दिल्ली के लिए एक AI-संचालित स्मार्ट पार्किंग प्रबंधन प्रणाली है। इसमें रियल-टाइम पार्किंग उपलब्धता, ANPR कैमरा एकीकरण, ऑनलाइन बुकिंग, UPI भुगतान, और नागरिक-केंद्रित सुविधाएं शामिल हैं।'
              : 'NIGAM-Park is an AI-powered smart parking management system for Delhi. Features include real-time parking availability, ANPR camera integration, online booking, UPI payments, and citizen-centric features.'}
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge>React</Badge>
            <Badge>TypeScript</Badge>
            <Badge>Supabase</Badge>
            <Badge>AI/ML</Badge>
            <Badge>Computer Vision</Badge>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
