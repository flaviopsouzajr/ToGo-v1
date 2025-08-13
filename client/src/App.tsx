import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import { AdminRoute } from "./lib/admin-route";
import HomePage from "@/pages/home-page";
import PlacesPage from "@/pages/places-page";
import MapPage from "@/pages/map-page";
import AboutPage from "@/pages/about-page";
import AdminPage from "@/pages/admin-page";
import CarouselAdminPage from "@/pages/carousel-admin-page";
import AuthPage from "@/pages/auth-page";
import ForgotPasswordPage from "@/pages/forgot-password-page";
import ResetPasswordPage from "@/pages/reset-password-page";
import { FriendsPage } from "@/pages/friends-page";
import { FriendProfilePage } from "@/pages/friend-profile-page";
import MyRecommendationsPage from "@/pages/my-recommendations-page";
import ProfilePage from "@/pages/profile-page";
import FeedPage from "@/pages/feed-page";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/places">
        <ProtectedRoute>
          <PlacesPage />
        </ProtectedRoute>
      </Route>
      <Route path="/map" component={MapPage} />
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
