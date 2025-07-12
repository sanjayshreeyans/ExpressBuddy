// /**
// import React, { useState } from 'react';
// import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
// import { LoginLink, RegisterLink } from '@kinde-oss/kinde-auth-react/components';
// import { useRive } from '@rive-app/react-canvas';
// import { Button } from '../ui/button';
// import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
// import { ArrowLeft, Sparkles, Mail, Lock, Eye, EyeOff } from 'lucide-react';
// import { motion } from 'framer-motion';e Authentication Page Component
//  * Integrated with Kinde authentication using LoginLink and RegisterLink
//  */

// import React, { useState } from 'react';
// // import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
// import { LoginLink, RegisterLink } from '@kinde-oss/kinde-auth-react/dist/components';
// import { useRive } from '@rive-app/react-canvas';
// import { Button } from '../ui/button';
// import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
// import { ArrowLeft, Sparkles, Mail, Lock, Eye, EyeOff } from 'lucide-react';
// import { motion } from 'framer-motion';

// interface SimpleAuthPageProps {
//   onBack: () => void;
//   mode?: 'signin' | 'signup';
// }

// export default function SimpleAuthPage({ onBack, mode = 'signin' }: SimpleAuthPageProps) {
// //   const { login, register, isAuthenticated, isLoading } = useKindeAuth();
//   const [authMode, setAuthMode] = useState<'signin' | 'signup'>(mode);
//   const [showPassword, setShowPassword] = useState(false);

//   // Rive animation for Pico
//   const { RiveComponent } = useRive({
//     src: '/pandabot.riv',
//     autoplay: true,
//     stateMachines: 'State Machine 1',
//   });

//   if (isLoading) {
//     return (
//       <div className="min-h-screen bg-white flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
//           <p className="text-gray-600">Loading...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
//       {/* Back Button */}
//       <motion.div
//         initial={{ opacity: 0, y: -20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.3 }}
//         className="absolute top-6 left-6 z-10"
//       >
//         <Button
//           variant="ghost"
//           size="sm"
//           onClick={onBack}
//           className="flex items-center gap-2 hover:bg-white/20 rounded-full px-4 py-2"
//         >
//           <ArrowLeft className="w-4 h-4" />
//           Back to Home
//         </Button>
//       </motion.div>

//       <div className="flex min-h-screen">
//         {/* Left Side - Authentication Form */}
//         <div className="flex-1 flex items-center justify-center p-8">
//           <motion.div
//             initial={{ opacity: 0, x: -50 }}
//             animate={{ opacity: 1, x: 0 }}
//             transition={{ duration: 0.6 }}
//             className="w-full max-w-md"
//           >
//             <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
//               <CardHeader className="text-center pb-8">
//                 <div className="flex items-center justify-center mb-4">
//                   <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
//                     <Sparkles className="h-6 w-6 text-white" />
//                   </div>
//                 </div>
//                 <CardTitle className="text-2xl font-bold text-gray-900">
//                   {authMode === 'signin' ? 'Welcome Back!' : 'Join ExpressBuddy'}
//                 </CardTitle>
//                 <p className="text-gray-600 mt-2">
//                   {authMode === 'signin' 
//                     ? "Sign in to continue your child's learning journey with Pico"
//                     : "Create your account and start your child's specialized learning path"
//                   }
//                 </p>
//               </CardHeader>

//               <CardContent className="space-y-6">
//                 {/* Kinde Authentication Buttons */}
//                 <div className="space-y-4">
//                   {authMode === 'signin' ? (
//                     <Button
//                       size="lg"
//                       onClick={() => login()}
//                       className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
//                     >
//                       Sign In with Kinde
//                     </Button>
//                   ) : (
//                     <Button
//                       size="lg"
//                       onClick={() => register()}
//                       className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
//                     >
//                       Sign Up with Kinde
//                     </Button>
//                   )}

//                   <div className="relative">
//                     <div className="absolute inset-0 flex items-center">
//                       <div className="w-full border-t border-gray-300"></div>
//                     </div>
//                     <div className="relative flex justify-center text-sm">
//                       <span className="px-2 bg-white text-gray-500">Or continue with</span>
//                     </div>
//                   </div>

//                   {/* Direct Login/Register Buttons */}
//                   <div className="grid grid-cols-2 gap-3">
//                     <Button
//                       variant="outline"
//                       onClick={() => login()}
//                       className="border-gray-300 hover:bg-gray-50"
//                     >
//                       <Mail className="w-4 h-4 mr-2" />
//                       {authMode === 'signin' ? 'Sign In' : 'Sign Up'}
//                     </Button>
//                     <Button
//                       variant="outline"
//                       onClick={() => register()}
//                       className="border-gray-300 hover:bg-gray-50"
//                     >
//                       <Lock className="w-4 h-4 mr-2" />
//                       Register
//                     </Button>
//                   </div>
//                 </div>

//                 {/* Mode Toggle */}
//                 <div className="text-center">
//                   <p className="text-sm text-gray-600">
//                     {authMode === 'signin' ? "Don't have an account? " : "Already have an account? "}
//                     <button
//                       onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
//                       className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
//                     >
//                       {authMode === 'signin' ? 'Sign up' : 'Sign in'}
//                     </button>
//                   </p>
//                 </div>

//                 {/* Features */}
//                 <div className="pt-4 border-t border-gray-200">
//                   <div className="flex justify-center space-x-6 text-xs text-gray-600">
//                     <div className="flex items-center space-x-1">
//                       <div className="w-2 h-2 bg-green-500 rounded-full"></div>
//                       <span>COPPA Compliant</span>
//                     </div>
//                     <div className="flex items-center space-x-1">
//                       <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
//                       <span>Secure</span>
//                     </div>
//                     <div className="flex items-center space-x-1">
//                       <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
//                       <span>Privacy First</span>
//                     </div>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>
//           </motion.div>
//         </div>

//         {/* Right Side - Pico Avatar */}
//         <div className="flex-1 flex items-center justify-center p-8">
//           <motion.div
//             initial={{ opacity: 0, x: 50 }}
//             animate={{ opacity: 1, x: 0 }}
//             transition={{ duration: 0.6, delay: 0.2 }}
//             className="relative"
//           >
//             {/* Pico Avatar Card */}
//             <div className="w-96 h-96 bg-white rounded-3xl shadow-2xl flex items-center justify-center border border-gray-200 overflow-hidden">
//               <div className="text-center space-y-6 p-8">
//                 <div className="w-64 h-64 mx-auto relative">
//                   {RiveComponent && (
//                     <RiveComponent 
//                       width="100%" 
//                       height="100%"
//                       style={{ borderRadius: '24px' }}
//                     />
//                   )}
//                 </div>
//                 <div>
//                   <h3 className="text-2xl font-bold text-gray-900 mb-2">Meet Pico!</h3>
//                   <p className="text-gray-600 text-sm">
//                     Your child's AI learning companion
//                   </p>
//                 </div>
//               </div>
//             </div>
            
//             {/* Floating Animation Elements */}
//             <motion.div
//               animate={{ 
//                 y: [0, -10, 0],
//                 rotate: [0, 5, 0]
//               }}
//               transition={{ 
//                 duration: 3,
//                 repeat: Infinity,
//                 ease: "easeInOut"
//               }}
//               className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg"
//             >
//               <Sparkles className="w-8 h-8 text-white" />
//             </motion.div>

//             <motion.div
//               animate={{ 
//                 y: [0, 10, 0],
//                 rotate: [0, -5, 0]
//               }}
//               transition={{ 
//                 duration: 4,
//                 repeat: Infinity,
//                 ease: "easeInOut",
//                 delay: 1
//               }}
//               className="absolute -bottom-4 -left-4 w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg"
//             >
//               <span className="text-white font-bold">Hi!</span>
//             </motion.div>

//             {/* Testimonial Cards */}
//             <div className="absolute -left-8 top-1/2 transform -translate-y-1/2">
//               <motion.div
//                 initial={{ opacity: 0, x: -20 }}
//                 animate={{ opacity: 1, x: 0 }}
//                 transition={{ duration: 0.6, delay: 0.8 }}
//                 className="bg-white rounded-2xl p-4 shadow-lg max-w-xs"
//               >
//                 <p className="text-sm text-gray-600 mb-2">
//                   "ExpressBuddy has been amazing for my son with autism. He loves talking to Pico!"
//                 </p>
//                 <div className="flex items-center space-x-2">
//                   <div className="w-6 h-6 bg-pink-500 rounded-full"></div>
//                   <span className="text-xs text-gray-500">Sarah M.</span>
//                 </div>
//               </motion.div>
//             </div>
//           </motion.div>
//         </div>
//       </div>
//     </div>
//   );
// }
