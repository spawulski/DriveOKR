// frontend/src/components/LandingPage/LandingPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Target, // For Goal Alignment
  LineChart, // For Progress Tracking
  Users, // For Team Collaboration
  Layers, // For Organization Structure
  GitBranch, // For Hierarchy View
  TrendingUp // For Performance Metrics
} from 'lucide-react';
import DriveOkrSS from '../../assets/Landing.png'


const LandingPage = () => {
  const { loginWithGithub, loginWithOkta } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative isolate overflow-hidden bg-gradient-to-b from-indigo-100/20">
        <div className="mx-auto max-w-7xl pb-24 pt-10 sm:pb-32 lg:grid lg:grid-cols-2 lg:gap-x-8 lg:px-8 lg:py-40">
          <div className="px-6 lg:px-0 lg:pt-4">
            <div className="mx-auto max-w-2xl">
              <div className="max-w-lg">
                <h1 className="mt-10 text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                  Drive success with better OKR management
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-600">
                  Align your organization, track progress, and achieve your objectives with DriveOKR. The modern platform for goal setting and performance management.
                </p>
                <div className="mt-10 flex items-center gap-x-6">
                  <button
                    onClick={loginWithGithub}
                    className="rounded-md bg-gray-800 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-700"
                  >
                    Sign in with GitHub
                  </button>
                  <button
                    onClick={loginWithOkta}
                    className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                  >
                    Sign in with OKTA
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-20 sm:mt-24 md:mx-auto md:max-w-2xl lg:mx-0 lg:mt-0 lg:w-screen">
            <div className="absolute inset-y-0 right-1/2 -z-10 overflow-hidden bg-gray-50 ring-1 ring-gray-900/10 lg:right-0">
              <svg className="absolute inset-0 h-full w-full stroke-gray-200 [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]" aria-hidden="true">
                <defs>
                  <pattern id="pattern-1" width="25" height="25" x="50%" y="0" patternUnits="userSpaceOnUse">
                    <path d="M.5 200V.5H200" fill="none" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" strokeWidth="0" fill="url(#pattern-1)" />
              </svg>
            </div>
            <img 
              src={DriveOkrSS} 
              alt="Image of the platform" 
              className="pt-20"
            />
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-indigo-600">Better Performance</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to manage OKRs
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              DriveOKR provides all the tools you need to set, track, and achieve your organizational goals.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              {features.map((feature) => (
                <div key={feature.name} className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
                      {feature.icon}
                    </div>
                    {feature.name}
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">{feature.description}</p>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* Social Proof Section */}
      <div className="bg-gray-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-x-8 gap-y-16 lg:grid-cols-2">
            <div className="mx-auto w-full max-w-xl lg:mx-0">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                Trusted by leading companies worldwide
              </h2>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Join absolutely zero organizations so far that use DriveOKR to align their teams and achieve their goals.
              </p>
              <div className="mt-8 flex items-center gap-x-6">
                {/* Add logos or testimonials */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const features = [
  {
    name: 'Goal Alignment',
    description: 'Ensure everyone is working towards the same objectives with our intuitive alignment tools.',
    icon: <Target className="h-5 w-5 text-indigo-600" />,
  },
  {
    name: 'Progress Tracking',
    description: 'Real-time progress tracking and updates keep everyone informed and motivated.',
    icon: <LineChart className="h-5 w-5 text-indigo-600" />,
  },
  {
    name: 'Team Collaboration',
    description: 'Built-in collaboration tools make it easy to work together towards common goals.',
    icon: <Users className="h-5 w-5 text-indigo-600" />,
  },
  {
    name: 'Organization Structure',
    description: 'Manage departments, teams, and individuals with a clear organizational hierarchy.',
    icon: <Layers className="h-5 w-5 text-indigo-600" />,
  },
  {
    name: 'Hierarchy View',
    description: 'Visualize how objectives cascade from organization level to individual contributors.',
    icon: <GitBranch className="h-5 w-5 text-indigo-600" />,
  },
  {
    name: 'Performance Metrics',
    description: 'Track key performance indicators and objective completion rates across your organization.',
    icon: <TrendingUp className="h-5 w-5 text-indigo-600" />,
  }
];


export default LandingPage;