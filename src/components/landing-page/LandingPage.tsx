import React from 'react';
import {
  Apple,
  ArrowRight,
  Calendar,
  CloudSun,
  ChevronDown,
  Facebook,
  Heart,
  Instagram,
  MapPin,
  Navigation2,
  Plane,
  Play,
  Quote,
  Send,
  Settings2,
  Twitter,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
import { cn } from '../../lib/utils';
import { VideoExpressBuddyAvatar } from '../avatar/VideoExpressBuddyAvatar';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from '../ui/navigation-menu';

const containerClass = 'mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8';

const assets = {
  heroDecor: 'https://www.figma.com/api/mcp/asset/e0bd6a99-1cdb-4b28-9e2d-a4ec77a039b8',
  heroTraveller: 'https://www.figma.com/api/mcp/asset/98847a39-f092-4484-916b-991433159778',
  heroPlane: 'https://www.figma.com/api/mcp/asset/bbf972a0-5c4f-4966-af9b-f93fe01f130e',
  destinationRome: 'https://www.figma.com/api/mcp/asset/28b07803-22d3-4d78-8474-c1efd19546d6',
  destinationLondon: 'https://www.figma.com/api/mcp/asset/c73c8640-7278-4d57-9e14-69b790f81662',
  destinationEurope: 'https://www.figma.com/api/mcp/asset/b9a27acf-4415-475c-86ae-2e6b575f5d30',
  tripImage: 'https://www.figma.com/api/mcp/asset/8af625a1-5be8-434d-a219-e5480dc0051d',
  tripAvatar: 'https://www.figma.com/api/mcp/asset/8521ecae-fd7c-45e5-8faf-66f386cca9d3',
  partner1: 'https://www.figma.com/api/mcp/asset/fd0317bb-e5bd-4e29-8011-6882c6c2ce50',
  partner2: 'https://www.figma.com/api/mcp/asset/1e5e6f56-9e68-4099-b7b4-bf6eca224e1d',
  partner3: 'https://www.figma.com/api/mcp/asset/bf8bc717-6cd4-4ee6-b185-4732195c4284',
  partner4: 'https://www.figma.com/api/mcp/asset/3c6e3796-210f-4c12-a7c9-d3bb9f59078c',
  partner5: 'https://www.figma.com/api/mcp/asset/6afcbaf3-d608-4ef8-b7f6-4ae69585d5a0',
  subscribeIcon: 'https://www.figma.com/api/mcp/asset/3852e801-07e5-4f21-8cf3-509df4b39555',
};

const navLinks = [
  { label: 'Destinations', href: '#destinations' },
  { label: 'Hotels', href: '#services' },
  { label: 'Flights', href: '#journeys' },
  { label: 'Bookings', href: '#steps' },
];

const serviceCards = [
  {
    title: 'Calculated Weather',
    description: 'Built Wicket longer admire do barton vanity itself do in it.',
    icon: CloudSun,
    iconClass: 'bg-[#f1a501]/15 text-[#f1a501]',
    cardClass: 'bg-white text-[#5e6282]',
    headingClass: 'text-[#1e1d4c]',
  },
  {
    title: 'Best Flights',
    description: 'Engrossed listening. Park gate sell they west hard for the.',
    icon: Plane,
    iconClass: 'bg-white/15 text-white',
    cardClass: 'bg-gradient-to-b from-[#ffae43] via-[#ff946d] to-[#ff7d68] text-white shadow-[0_120px_150px_-100px_rgba(223,105,81,0.45)]',
    headingClass: 'text-white',
    featured: true,
  },
  {
    title: 'Local Events',
    description: 'Barton vanity itself do in it. Preferd to men it engrossed listening.',
    icon: MapPin,
    iconClass: 'bg-[#6246e5]/15 text-[#6246e5]',
    cardClass: 'bg-white text-[#5e6282]',
    headingClass: 'text-[#1e1d4c]',
  },
  {
    title: 'Customization',
    description: 'We deliver outsourced aviation services for military customers.',
    icon: Settings2,
    iconClass: 'bg-[#f15a2b]/10 text-[#f15a2b]',
    cardClass: 'bg-white text-[#5e6282]',
    headingClass: 'text-[#1e1d4c]',
  },
];

const destinationCards = [
  {
    title: 'Rome, Italy',
    price: '$5,42k',
    duration: '10 Days Trip',
    image: assets.destinationRome,
  },
  {
    title: 'London, UK',
    price: '$4.2k',
    duration: '12 Days Trip',
    image: assets.destinationLondon,
  },
  {
    title: 'Full Europe',
    price: '$15k',
    duration: '28 Days Trip',
    image: assets.destinationEurope,
  },
];

const stepItems = [
  {
    title: 'Choose Destination',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Urna, tortor tempus.',
    icon: MapPin,
    iconBg: 'bg-[#f1a501]/20 text-[#f1a501]',
  },
  {
    title: 'Make Payment',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Urna, tortor tempus.',
    icon: Send,
    iconBg: 'bg-[#f15a2b]/10 text-[#f15a2b]',
  },
  {
    title: 'Reach Airport on Selected Date',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Urna, tortor tempus.',
    icon: Navigation2,
    iconBg: 'bg-[#006380]/10 text-[#006380]',
  },
];

const testimonials = [
  {
    quote: '“On the Windows talking painted pasture yet its express parties use. Sure last upon he same as knew next. Of believed or diverted no.”',
    name: 'Mike Taylor',
    role: 'Lahore, Pakistan',
  },
  {
    quote: '“On the Windows talking painted pasture yet its express parties use. Sure last upon he same as knew next. Of believed or diverted no.”',
    name: 'Chris Thomas',
    role: 'CEO of Red Button',
  },
];

const partners = [
  { name: 'Axon', image: assets.partner1 },
  { name: 'Jetsark', image: assets.partner2 },
  { name: 'Expedia', image: assets.partner3 },
  { name: 'Qantas', image: assets.partner4 },
  { name: 'Alitalia', image: assets.partner5 },
];

const socialLinks = [
  { label: 'Facebook', icon: Facebook, href: 'https://facebook.com' },
  { label: 'Twitter', icon: Twitter, href: 'https://twitter.com' },
  { label: 'Instagram', icon: Instagram, href: 'https://instagram.com' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useSupabaseAuth();
  const [email, setEmail] = React.useState('');
  const [activeTestimonial, setActiveTestimonial] = React.useState(0);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  const handleSubscribe = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) {
      return;
    }
    handleGetStarted();
  };

  return (
    <div className="flex min-h-screen flex-col bg-white text-[#5e6282]">
      <header className="relative z-20 bg-white">
        <div className={`${containerClass} flex flex-wrap items-center justify-between gap-6 py-8`}>
          <div className="flex items-center gap-[2px]">
            <span className="font-['Volkhov',serif] text-[32px] font-bold leading-none text-[#181e4b]">Jadoo</span>
            <span className="text-[34px] leading-none text-[#f1a501]">.</span>
          </div>
          <NavigationMenu className="flex flex-1 flex-wrap items-center justify-end gap-4">
            <NavigationMenuList className="flex flex-wrap items-center gap-7 font-['Poppins',sans-serif] text-sm font-medium text-[#212832]">
              {navLinks.map((link, index) => (
                <NavigationMenuItem key={link.label}>
                  <NavigationMenuLink
                    href={link.href}
                    className={cn('inline-flex items-center gap-1 transition hover:text-[#f1a501]', index === 0 && 'text-[#f1a501]')}
                  >
                    {link.label}
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
              <NavigationMenuItem>
                <NavigationMenuLink
                  href="/login"
                  className="inline-flex items-center transition hover:text-[#f1a501]"
                  onClick={(event) => {
                    event.preventDefault();
                    navigate('/login');
                  }}
                >
                  Login
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Button
                    variant="outline"
                    className="h-11 rounded-[5px] border border-[#212832] px-6 text-sm font-medium text-[#212832] hover:bg-[#f1a501] hover:text-white"
                    onClick={handleGetStarted}
                  >
                    Sign up
                  </Button>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink
                  href="#"
                  className="inline-flex items-center gap-1 transition hover:text-[#f1a501]"
                  onClick={(event) => event.preventDefault()}
                >
                  EN
                  <ChevronDown className="h-4 w-4" />
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden pt-16">
          <div className="absolute inset-0 -z-10">
            <img src={assets.heroDecor} alt="Decor" className="hidden h-full w-full object-cover lg:block" />
          </div>
          <div className={`${containerClass} grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,540px)] lg:items-center`}>
            <div className="space-y-8">
              <p className="font-['Poppins',sans-serif] text-sm font-semibold uppercase tracking-[0.3em] text-[#df6951]">
                Best Destinations across the world
              </p>
              <h1 className="font-['Volkhov',serif] text-[56px] leading-[60px] text-[#181e4b] sm:text-[65px] sm:leading-[70px]">
                Travel, enjoy and live a new and full life
              </h1>
              <p className="max-w-xl font-['Poppins',sans-serif] text-lg leading-[30px] text-[#5e6282]">
                Built Wicket longer admire do barton vanity itself do in it. Preferred to sportsmen it engrossed listening. Park gate sell they west hard for the.
              </p>
              <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
                <Button
                  className="h-12 rounded-[10px] bg-[#f1a501] px-8 text-base font-semibold text-white shadow-[0_20px_35px_-25px_rgba(241,165,1,0.8)] hover:bg-[#ffbb37]"
                  onClick={handleGetStarted}
                >
                  Find out more
                </Button>
                <button
                  type="button"
                  className="flex items-center gap-4 font-['Poppins',sans-serif] text-sm font-semibold text-[#686d77]"
                  onClick={() => navigate('/video-avatar-demo')}
                >
                  <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-[0_15px_45px_-25px_rgba(24,30,75,0.5)]">
                    <Play className="h-5 w-5 text-[#df6951]" />
                  </span>
                  Play Demo
                </button>
              </div>
            </div>
            <div className="relative mx-auto flex w-full max-w-[540px] justify-center">
              <div className="relative w-full">
                <img src={assets.heroTraveller} alt="Traveller" className="w-full" />
                <img src={assets.heroPlane} alt="Plane" className="absolute -right-10 top-10 hidden w-28 lg:block" />
                <div className="absolute bottom-24 left-6 h-40 w-40 overflow-hidden rounded-full border-[6px] border-white shadow-[0_30px_80px_-40px_rgba(24,30,75,0.65)]">
                  <VideoExpressBuddyAvatar
                    className="h-full w-full"
                    isListening={false}
                    hideDebugInfo
                    disableClickInteraction
                    backgroundSrc=""
                  />
                </div>
                <Card className="absolute bottom-4 left-4 w-[280px] rounded-[18px] border-none bg-white shadow-[0_40px_70px_-45px_rgba(24,30,75,0.45)]">
                  <CardContent className="p-4">
                    <div className="h-28 overflow-hidden rounded-[18px]">
                      <img src={assets.tripImage} alt="Trip to Greece" className="h-full w-full object-cover" />
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between font-['Poppins',sans-serif]">
                        <span className="text-sm font-semibold text-[#5e6282]">Trip To Greece</span>
                        <span className="text-sm font-semibold text-[#181e4b]">$5,42k</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[#5e6282]">
                        <span>14-29 June</span>
                        <span>by Robbin joseph</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[#5e6282]">
                        <span className="inline-flex items-center gap-1"><Send className="h-4 w-4 text-[#f1a501]" /> 24 people going</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="absolute right-2 top-10 w-[220px] rounded-[18px] border-none bg-white shadow-[0_30px_70px_-50px_rgba(24,30,75,0.4)]">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="relative h-12 w-12 overflow-hidden rounded-full">
                      <img src={assets.tripAvatar} alt="Trip badge" className="h-full w-full object-cover" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-[#84829a]">Ongoing</p>
                      <p className="text-sm font-semibold text-[#181e4b]">Trip to rome</p>
                      <div className="flex items-center gap-1 text-xs text-[#5e6282]">
                        <Calendar className="h-3 w-3" /> 40% completed
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <section id="services" className="relative bg-white py-20">
          <div className="pointer-events-none absolute right-16 top-8 hidden text-2xl leading-none text-[#6246e5]/20 lg:grid lg:grid-cols-4 lg:gap-4">
            {Array.from({ length: 16 }).map((_, index) => (
              <span key={index}>+</span>
            ))}
          </div>
          <div className={`${containerClass} space-y-12`}>
            <div className="text-center">
              <p className="font-['Poppins',sans-serif] text-sm font-semibold uppercase tracking-[0.3em] text-[#5e6282]">Category</p>
              <h2 className="font-['Volkhov',serif] text-[50px] text-[#14183e]">We Offer Best Services</h2>
            </div>
            <div className="grid gap-6 lg:grid-cols-4">
              {serviceCards.map((service) => (
                <Card
                  key={service.title}
                  className="relative h-full rounded-[36px] border-none bg-transparent shadow-none"
                >
                  {service.featured && (
                    <span className="pointer-events-none absolute -left-6 bottom-8 h-24 w-24 rounded-[30px] bg-[#df6951] opacity-90" />
                  )}
                  <div
                    className={cn(
                      'relative z-10 flex h-full flex-col gap-5 rounded-[36px] border border-[#f7f7f7] p-8 shadow-[0_90px_120px_-90px_rgba(24,30,75,0.45)] transition hover:-translate-y-1',
                      service.cardClass,
                      service.featured && 'border-none'
                    )}
                  >
                    {service.featured && (
                      <span className="absolute right-6 top-6 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white">
                        <Plane className="h-6 w-6" />
                      </span>
                    )}
                    <span className={cn('inline-flex h-14 w-14 items-center justify-center rounded-[18px]', service.iconClass)}>
                      <service.icon className="h-7 w-7" />
                    </span>
                    <h3 className={cn("font-['Open Sans',sans-serif] text-lg font-semibold", service.headingClass)}>{service.title}</h3>
                    <p className={cn("font-['Poppins',sans-serif] text-sm", service.featured ? 'text-white/90' : 'text-[#5e6282]')}>
                      {service.description}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="destinations" className="bg-white py-20">
          <div className={`${containerClass} space-y-12`}>
            <div className="text-center">
              <p className="font-['Poppins',sans-serif] text-sm font-semibold uppercase tracking-[0.3em] text-[#5e6282]">Top Selling</p>
              <h2 className="font-['Volkhov',serif] text-[50px] text-[#14183e]">Top Destinations</h2>
            </div>
            <div className="grid gap-8 lg:grid-cols-3">
              {destinationCards.map((destination) => (
                <Card key={destination.title} className="overflow-hidden rounded-[24px] border-none bg-white shadow-[0_90px_120px_-100px_rgba(24,30,75,0.5)]">
                  <CardContent className="p-0">
                    <div className="h-64 w-full overflow-hidden">
                      <img src={destination.image} alt={destination.title} className="h-full w-full object-cover" />
                    </div>
                    <div className="p-6">
                      <div className="flex items-center justify-between font-['Poppins',sans-serif] text-sm text-[#5e6282]">
                        <span className="font-semibold text-[#1e1d4c]">{destination.title}</span>
                        <span className="font-semibold">{destination.price}</span>
                      </div>
                      <div className="mt-4 inline-flex items-center gap-2 font-['Poppins',sans-serif] text-xs text-[#5e6282]">
                        <Send className="h-4 w-4 text-[#f1a501]" />
                        {destination.duration}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="steps" className="bg-[#fef6f0] py-20">
          <div className={`${containerClass} grid gap-12 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:items-center`}>
            <div className="space-y-6">
              <p className="font-['Poppins',sans-serif] text-sm font-semibold uppercase tracking-[0.3em] text-[#5e6282]">Easy and Fast</p>
              <h2 className="font-['Volkhov',serif] text-[50px] text-[#14183e] leading-tight">
                Book your next trip in 3 easy steps
              </h2>
              <div className="space-y-6">
                {stepItems.map((step) => (
                  <div key={step.title} className="flex items-start gap-4">
                    <span className={cn('inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[18px] text-base', step.iconBg)}>
                      <step.icon className="h-6 w-6" />
                    </span>
                    <div className="space-y-1 font-['Poppins',sans-serif]">
                      <h3 className="font-semibold text-[#1e1d4c]">{step.title}</h3>
                      <p className="text-sm text-[#5e6282]">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-[380px]">
              <Card className="rounded-[32px] border-none bg-white shadow-[0_100px_120px_-80px_rgba(24,30,75,0.45)]">
                <CardContent className="space-y-4 p-6">
                  <div className="h-36 overflow-hidden rounded-[26px]">
                    <img src={assets.tripImage} alt="Trip to Greece" className="h-full w-full object-cover" />
                  </div>
                  <div className="space-y-2 font-['Poppins',sans-serif] text-sm">
                    <div className="flex items-center justify-between text-[#5e6282]">
                      <span className="font-semibold text-[#1e1d4c]">Trip To Greece</span>
                      <span>$5,42k</span>
                    </div>
                    <div className="flex items-center gap-3 text-[#84829a]">
                      <span>14-29 June</span>
                      <span>by Robbin joseph</span>
                    </div>
                    <div className="flex items-center gap-3 text-[#5e6282]">
                      <span className="inline-flex items-center gap-1"><Heart className="h-4 w-4 text-[#df6951]" /> 24 people going</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="absolute -right-8 bottom-10 w-[220px] rounded-[18px] border-none bg-white shadow-[0_60px_90px_-60px_rgba(24,30,75,0.4)]">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="relative h-12 w-12 overflow-hidden rounded-full">
                    <img src={assets.tripAvatar} alt="Trip avatar" className="h-full w-full object-cover" />
                  </div>
                  <div className="font-['Poppins',sans-serif] text-xs text-[#5e6282]">
                    <p className="font-semibold text-[#84829a]">Ongoing</p>
                    <p className="text-sm font-semibold text-[#1e1d4c]">Trip to rome</p>
                    <p className="text-xs text-[#5e6282]">40% completed</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section id="testimonials" className="bg-white py-20">
          <div className={`${containerClass} grid gap-12 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:items-start`}>
            <div className="space-y-4">
              <p className="font-['Poppins',sans-serif] text-sm font-semibold uppercase tracking-[0.3em] text-[#5e6282]">Testimonials</p>
              <h2 className="font-['Volkhov',serif] text-[50px] leading-none text-[#14183e]">
                What people say about Us.
              </h2>
              <div className="h-12 w-[87px] rounded-full bg-[#f1a501]" />
            </div>
            <div className="relative">
              <Card className="relative z-10 max-w-xl rounded-[25px] border-none bg-white shadow-[0_90px_120px_-80px_rgba(24,30,75,0.4)]">
                <CardContent className="space-y-6 p-8">
                  <Quote className="h-10 w-10 text-[#f1a501]" />
                  <p className="font-['Open Sans',sans-serif] text-lg leading-[32px] text-[#4e4e73]">
                    {testimonials[activeTestimonial].quote}
                  </p>
                  <div className="font-['Poppins',sans-serif]">
                    <p className="text-lg font-semibold text-[#5e6282]">{testimonials[activeTestimonial].name}</p>
                    <p className="text-sm text-[#5e6282]">{testimonials[activeTestimonial].role}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="absolute right-6 top-16 hidden w-[360px] rounded-[20px] border-2 border-[#f7f7f7] bg-white/70 shadow-none lg:block">
                <CardContent className="space-y-3 p-6 text-[#4e4e73]">
                  <p className="font-['Open Sans',sans-serif] text-base leading-[28px]">
                    {testimonials[(activeTestimonial + 1) % testimonials.length].quote}
                  </p>
                  <div className="font-['Poppins',sans-serif] text-sm">
                    <p className="font-semibold text-[#5e6282]">{testimonials[(activeTestimonial + 1) % testimonials.length].name}</p>
                    <p className="text-[#5e6282]">{testimonials[(activeTestimonial + 1) % testimonials.length].role}</p>
                  </div>
                </CardContent>
              </Card>
              <div className="mt-6 flex gap-3">
                {testimonials.map((testimonial, index) => (
                  <button
                    key={testimonial.name}
                    type="button"
                    className={cn('h-3 w-3 rounded-full transition', index === activeTestimonial ? 'bg-[#f1a501]' : 'bg-[#d7d7e3]')}
                    onClick={() => setActiveTestimonial(index)}
                    aria-label={`Show testimonial ${testimonial.name}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-16">
          <div className={`${containerClass} grid items-center gap-10 sm:grid-cols-2 lg:grid-cols-5`}>
            {partners.map((partner) => (
              <div key={partner.name} className="flex items-center justify-center">
                <img src={partner.image} alt={`${partner.name} logo`} className="max-h-16 object-contain" />
              </div>
            ))}
          </div>
        </section>

        <section id="subscribe" className="relative py-20">
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <img src={assets.subscribeIcon} alt="decoration" className="absolute right-12 top-12 w-16" />
          </div>
          <div className={`${containerClass}`}>
            <Card className="relative overflow-hidden rounded-[36px] border-none bg-[#fdf4ed] shadow-[0_120px_160px_-100px_rgba(24,30,75,0.55)]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(98,70,229,0.1),_transparent_70%)]" />
              <CardContent className="relative space-y-8 px-6 py-16 sm:px-16">
                <p className="text-center font-['Poppins',sans-serif] text-2xl font-semibold text-[#5e6282]">
                  Subscribe to get information, latest news and other interesting offers about Jadoo
                </p>
                <form onSubmit={handleSubscribe} className="mx-auto flex w-full flex-col gap-4 sm:max-w-2xl sm:flex-row">
                  <Input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Your email"
                    className="h-14 flex-1 rounded-[10px] border-none bg-white px-6 font-['Poppins',sans-serif] text-sm text-[#39425d] shadow-[0_25px_100px_-70px_rgba(24,30,75,0.8)] focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  <Button
                    type="submit"
                    className="h-14 rounded-[10px] bg-gradient-to-b from-[#ff946d] to-[#ff7d68] px-8 font-['Poppins',sans-serif] text-sm font-semibold text-white shadow-[0_35px_90px_-70px_rgba(223,105,81,0.8)]"
                  >
                    Subscribe
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <footer className="bg-[#fff] pb-12 pt-16">
        <div className={`${containerClass} grid gap-12 lg:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,1fr))]`}>
          <div className="space-y-4">
            <span className="text-[44px] font-bold leading-[54px] text-[#181e4b]">Jadoo.</span>
            <p className="font-['Poppins',sans-serif] text-sm text-[#5e6282]">
              Book your trip in minute, get full control for much longer.
            </p>
          </div>
          <div>
            <h3 className="font-['Poppins',sans-serif] text-[21px] font-bold text-[#080809]">Company</h3>
            <ul className="mt-4 space-y-2 font-['Poppins',sans-serif] text-[18px] text-[#5e6282]">
              <li>About</li>
              <li>Careers</li>
              <li>Mobile</li>
            </ul>
          </div>
          <div>
            <h3 className="font-['Poppins',sans-serif] text-[21px] font-bold text-[#080809]">Contact</h3>
            <ul className="mt-4 space-y-2 font-['Poppins',sans-serif] text-[18px] text-[#5e6282]">
              <li>Help/FAQ</li>
              <li>Press</li>
              <li>Affiliates</li>
            </ul>
          </div>
          <div>
            <h3 className="font-['Poppins',sans-serif] text-[21px] font-bold text-[#080809]">More</h3>
            <ul className="mt-4 space-y-2 font-['Poppins',sans-serif] text-[18px] text-[#5e6282]">
              <li>Airlinefees</li>
              <li>Airline</li>
              <li>Low fare tips</li>
            </ul>
          </div>
        </div>
        <div className={`${containerClass} mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center`}>
          <div className="flex gap-4">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-[0_20px_40px_-30px_rgba(24,30,75,0.5)]"
                aria-label={social.label}
              >
                <social.icon className="h-5 w-5 text-[#5e6282]" />
              </a>
            ))}
          </div>
          <button className="inline-flex items-center gap-3 rounded-[17.5px] bg-black px-4 py-3 text-xs font-semibold text-white">
            <Apple className="h-5 w-5" />
            <span className="flex flex-col leading-none">
              <span className="text-[10px]">Get it on</span>
              <span className="text-sm">App Store</span>
            </span>
          </button>
          <button className="inline-flex items-center gap-3 rounded-[17.5px] border border-[#5e6282] px-4 py-3 text-xs font-semibold text-[#5e6282]">
            <Play className="h-5 w-5" />
            <span className="flex flex-col leading-none">
              <span className="text-[10px]">Get it on</span>
              <span className="text-sm">Google Play</span>
            </span>
          </button>
        </div>
        <div className="mt-12 text-center font-['Poppins',sans-serif] text-sm text-[#5e6282]">
          All rights reserved@jadoo.co
        </div>
      </footer>
    </div>
  );
}
