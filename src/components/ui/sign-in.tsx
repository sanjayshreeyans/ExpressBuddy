import React from 'react';
// Eye and EyeOff are no longer needed as password field is removed.
// import { Eye, EyeOff } from 'lucide-react'; 

// GoogleIcon is no longer needed as Google sign-in is removed.
// const GoogleIcon = () => (
//     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 48 48">
//         <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s12-5.373 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-2.641-.21-5.236-.611-7.743z" />
//         <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
//         <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
//         <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.022 35.026 44 30.038 44 24c0-2.641-.21-5.236-.611-7.743z" />
//     </svg>
// );


// --- TYPE DEFINITIONS ---

// Testimonial type is no longer needed as testimonials are removed.
// export interface Testimonial {
//   avatarSrc: string;
//   name: string;
//   handle: string;
//   text: string;
// }

interface SignInPageProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  // heroImageSrc and testimonials are no longer needed.
  // heroImageSrc?: string;
  // testimonials?: Testimonial[];
  onSignIn?: () => void;
  onSignUp?: () => void; // Updated for button click handlers.
  // onGoogleSignIn, onResetPassword, onCreateAccount are no longer needed.
  // onGoogleSignIn?: () => void;
  // onResetPassword?: () => void;
  // onCreateAccount?: () => void;
}

// --- SUB-COMPONENTS ---

// GlassInputWrapper is no longer needed as input fields are removed.
// const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
//   <div className="rounded-2xl border border-gray-200 bg-white/60 backdrop-blur-sm transition-colors focus-within:border-blue-400/70 focus-within:bg-blue-500/10 focus-within:shadow-lg">
//     {children}
//   </div>
// );

// TestimonialCard is no longer needed as testimonials are removed.
// const TestimonialCard = ({ testimonial, delay }: { testimonial: Testimonial, delay: string }) => (
//   <div className={`animate-testimonial ${delay} flex items-start gap-3 rounded-3xl bg-card/40 dark:bg-zinc-800/40 backdrop-blur-xl border border-white/10 p-5 w-64`}>
//     <img src={testimonial.avatarSrc} className="h-10 w-10 object-cover rounded-2xl" alt="avatar" />
//     <div className="text-sm leading-snug">
//       <p className="flex items-center gap-1 font-medium">{testimonial.name}</p>
//       <p className="text-muted-foreground">{testimonial.handle}</p>
//       <p className="mt-1 text-foreground/80">{testimonial.text}</p>
//     </div>
//   </div>
// );

// --- MAIN COMPONENT ---

export const SignInPage: React.FC<SignInPageProps> = ({
  title = <span className="font-light text-foreground tracking-tighter">Welcome</span>,
  description = "Access your account and continue your journey with us",
  // heroImageSrc and testimonials are removed from destructuring.
  // heroImageSrc,
  // testimonials = [],
  onSignIn,
  onSignUp, // Added onSignUp prop.
  // onGoogleSignIn, onResetPassword, onCreateAccount are removed from destructuring.
  // onGoogleSignIn,
  // onResetPassword,
  // onCreateAccount,
}) => {
  // showPassword state is no longer needed as password field is removed.
  // const [showPassword, setShowPassword] = useState(false);

  return (
    // Only one column now, so remove flex-col md:flex-row
    <div className="h-[100dvh] flex items-center justify-center font-geist w-[100dvw] bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Centered content column */}
      <section className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-6 bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20">
            <h1 className="animate-element animate-delay-100 text-4xl md:text-5xl font-semibold leading-tight text-center">{title}</h1>
            <p className="animate-element animate-delay-200 text-muted-foreground text-center">{description}</p>

            {/* No form needed as Kinde handles input. Buttons directly trigger Kinde methods. */}
            <div className="space-y-4 mt-6"> {/* Use a div for button layout */}
              <button
                onClick={onSignIn} // Directly call onSignIn
                className="animate-element animate-delay-300 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 py-4 font-medium text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Sign In
              </button>

              <button
                onClick={onSignUp} // Directly call onSignUp
                className="animate-element animate-delay-400 w-full rounded-2xl border border-gray-200 py-4 bg-white/50 hover:bg-white/70 transition-colors text-gray-700 font-medium shadow-md hover:shadow-lg"
              >
                Sign Up
              </button>
            </div>

            {/* Removed "Or continue with" divider and Google button */}
            {/* Removed "New to our platform?" text and "Create Account" link */}
          </div>
        </div>
      </section>

      {/* Right column (hero image + testimonials) is entirely removed */}
      {/* {heroImageSrc && (
        <section className="hidden md:block flex-1 relative p-8">
          <div className="animate-slide-right animate-delay-300 absolute inset-8 rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-white/20 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="text-6xl mb-4">🤖</div>
              <h2 className="text-2xl font-bold mb-2">Meet Your AI Companion</h2>
              <p className="text-lg opacity-90">Personalized learning for every child</p>
            </div>
          </div>
          {testimonials.length > 0 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 px-8 w-full justify-center">
              <TestimonialCard testimonial={testimonials[0]} delay="animate-delay-1000" />
              {testimonials[1] && <div className="hidden xl:flex"><TestimonialCard testimonial={testimonials[1]} delay="animate-delay-1200" /></div>}
              {testimonials[2] && <div className="hidden 2xl:flex"><TestimonialCard testimonial={testimonials[2]} delay="animate-delay-1400" /></div>}
            </div>
          )}
        </section>
      )} */}
    </div>
  );
};