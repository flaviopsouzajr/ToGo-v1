import { lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import { AdminRoute } from "./lib/admin-route";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import { PageLoader } from "@/components/page-loader";

const PlacesPage = lazy(() => import("@/pages/places-page"));
const MapPage = lazy(() => import("@/pages/map-page"));
const AboutPage = lazy(() => import("@/pages/about-page"));
const AdminPage = lazy(() => import("@/pages/admin-page"));
const CarouselAdminPage = lazy(() => import("@/pages/carousel-admin-page"));
const ForgotPasswordPage = lazy(() => import("@/pages/forgot-password-page"));
const ResetPasswordPage = lazy(() => import("@/pages/reset-password-page"));
const FriendsPage = lazy(() => import("@/pages/friends-page").then(m => ({ default: m.FriendsPage })));
const FriendProfilePage = lazy(() => import("@/pages/friend-profile-page").then(m => ({ default: m.FriendProfilePage })));
const MyRecommendationsPage = lazy(() => import("@/pages/my-recommendations-page"));
const ProfilePage = lazy(() => import("@/pages/profile-page"));
const FeedPage = lazy(() => import("@/pages/feed-page"));
const NotFound = lazy(() => import("@/pages/not-found"));

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/places">
          <ProtectedRoute>
            <PlacesPage />
          </ProtectedRoute>
        </Route>
        <Route path="/mapa">
          <ProtectedRoute>
            <MapPage />
          </ProtectedRoute>
        </Route>
        <Route path="/friends">
          <ProtectedRoute>
            <FriendsPage />
          </ProtectedRoute>
        </Route>
        <Route path="/friend-profile/:friendId">
          <ProtectedRoute>
            <FriendProfilePage />
          </ProtectedRoute>
        </Route>
        <Route path="/my-recommendations">
          <ProtectedRoute>
            <MyRecommendationsPage />
          </ProtectedRoute>
        </Route>
        <Route path="/profile">
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        </Route>
        <Route path="/feed">
          <ProtectedRoute>
            <FeedPage />
          </ProtectedRoute>
        </Route>
        <Route path="/about" component={AboutPage} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/forgot-password" component={ForgotPasswordPage} />
        <Route path="/reset-password" component={ResetPasswordPage} />
        <Route path="/admin" component={AdminPage} />
        <Route path="/carousel-admin">
          <AdminRoute>
            <CarouselAdminPage />
          </AdminRoute>
        </Route>
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
