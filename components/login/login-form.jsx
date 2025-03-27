        // components/LoginForm.jsx
        "use client";

        import { useState } from "react";
        import { useRouter } from "next/navigation";
        import Cookies from "js-cookie";
        import { cn } from "@/lib/utils";
        import { Button } from "@/components/ui/button";
        import { Card, CardContent } from "@/components/ui/card";
        import { Input } from "@/components/ui/input";
        import { Label } from "@/components/ui/label";
        import {
          Select,
          SelectContent,
          SelectItem,
          SelectTrigger,
          SelectValue,
        } from "@/components/ui/select";
        import { Eye, EyeOff, CheckCircle } from "lucide-react";
        import { loginUser } from "@/utils/auth-apis";
        import { useToast } from "@/hooks/use-toast";

        export function LoginForm({ className, ...props }) {
          const [showPassword, setShowPassword] = useState(false);
          const [formData, setFormData] = useState({
            email: "",
            role: "",
            password: "",
          });
          const [isLoading, setIsLoading] = useState(false);
          const [loginSuccess, setLoginSuccess] = useState(false);
          const [errors, setErrors] = useState({
            email: false,
            role: false,
            password: false,
          });
          const router = useRouter();
          const { toast } = useToast();

          const handleInputChange = (e) => {
            const { id, value } = e.target;
            setFormData((prev) => ({ ...prev, [id]: value }));
            // Clear error for this field when user types
            setErrors((prev) => ({ ...prev, [id]: false }));
          };

          const handleRoleChange = (value) => {
            setFormData((prev) => ({ ...prev, role: value }));
            setErrors((prev) => ({ ...prev, role: false }));
          };

          const validateForm = () => {
            const newErrors = {
              email: !formData.email,
              role: !formData.role,
              password: !formData.password,
            };
            
            setErrors(newErrors);
            return !Object.values(newErrors).some(Boolean);
          };

          const handleSubmit = async (e) => {
            e.preventDefault();
            setIsLoading(true);

            if (!validateForm()) {
              toast({
                variant: "destructive",
                title: "Error",
                description: "Please fill in all fields",
              });
              setIsLoading(false);
              return;
            }

            try {
              const response = await loginUser(formData);

              // Set cookies with explicit attributes
              Cookies.set("token", response.token, {
                expires: 1, // Expires in 1 day
                path: "/",
                sameSite: "Lax",
                secure: process.env.NODE_ENV === "production",
                httpOnly: false,
              });

              // Save user details to cookies
              Cookies.set(
                "userName",
                `${response.user.firstname} ${response.user.lastname}`,
                {
                  expires: 1, // Expires in 1 day
                  path: "/",
                  sameSite: "Lax",
                  secure: process.env.NODE_ENV === "production",
                  httpOnly: false,
                }
              );

              Cookies.set("userEmail", response.user.email, {
                expires: 1, // Expires in 1 day
                path: "/",
                sameSite: "Lax",
                secure: process.env.NODE_ENV === "production",
                httpOnly: false,
              });

              Cookies.set("userRole", response.user.role, {
                expires: 1, // Expires in 1 day
                path: "/",
                sameSite: "Lax",
                secure: process.env.NODE_ENV === "production",
                httpOnly: false,
              });

              Cookies.set("userCreatedAt", response.user.created_at, {
                expires: 1, // Expires in 1 day
                path: "/",
                sameSite: "Lax",
                secure: process.env.NODE_ENV === "production",
                httpOnly: false,
              });

              toast({
                title: "Success",
                description: "Login successful!",
              });

              // Update state to show success screen
              setLoginSuccess(true);

              // Redirect after showing success screen
              setTimeout(() => {
                window.location.href = "/"; // Forces browser to reload with cookies
              }, 3000);
            } catch (error) {
              toast({
                variant: "destructive",
                title: "Login Failed",
                description: error.error || "Invalid credentials",
              });
              
              // Set all inputs to show error state
              setErrors({
                email: true,
                role: true,
                password: true,
              });
            } finally {
              setIsLoading(false);
            }
          };

          return (
            <div className={cn("flex flex-col gap-6", className)} {...props}>
              <Card className="overflow-hidden backdrop-blur-sm shadow-[rgba(50,_50,_105,_0.15)_0px_2px_5px_0px,_rgba(0,_0,_0,_0.05)_0px_1px_1px_0px]">
                <CardContent className="grid p-0 md:grid-cols-2">
                  {!loginSuccess ? (
                    <form className="p-6 md:p-8" onSubmit={handleSubmit}>
                      <div className="flex flex-col gap-6">
                        <div className="flex flex-col items-center text-center">
                          <h1 className="text-2xl font-bold">Welcome back</h1>
                          <p className="text-balance text-muted-foreground">
                            Login to your account
                          </p>
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="m@example.com"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            disabled={isLoading}
                            className={errors.email ? "border-red-500" : ""}
                          />
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="role">Role</Label>
                          <Select
                            name="role"
                            value={formData.role}
                            onValueChange={handleRoleChange}
                            required
                            disabled={isLoading}
                          >
                            <SelectTrigger 
                              id="role"
                              className={errors.role ? "border-red-500" : ""}
                            >
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="developer">Developer</SelectItem>
                              <SelectItem value="executive">Executive</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid gap-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="password">Password</Label>
                            <a
                              href="#"
                              className="text-sm text-muted-foreground hover:underline underline-offset-2"
                            >
                              Forgot your password?
                            </a>
                          </div>
                          <div className="relative">
                            <Input
                              id="password"
                              type={showPassword ? "text" : "password"}
                              value={formData.password}
                              onChange={handleInputChange}
                              required
                              className={cn("pr-10", errors.password ? "border-red-500" : "")}
                              placeholder="••••••••"
                              disabled={isLoading}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-1/2 -translate-y-1/2 h-7 w-7"
                              onClick={() => setShowPassword(!showPassword)}
                              disabled={isLoading}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading}>
                          {isLoading ? "Logging in..." : "Login"}
                        </Button>

                        <div className="text-center text-sm">
                          Don't have an account?{" "}
                          <a
                            href="mailto:admin@example.com"
                            className="underline underline-offset-4 hover:text-primary"
                          >
                            Contact admin to register
                          </a>
                        </div>
                      </div>
                    </form>
                  ) : null}

                  <div className={cn(
                    "relative bg-muted p-6 flex flex-col items-center justify-center",
                    loginSuccess ? "md:col-span-2" : "hidden md:flex"
                  )}>
                    {loginSuccess ? (
                      <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto">
                        <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                        <h2 className="text-3xl font-bold mb-2 tracking-tight">Login Successful!</h2>
                        <p className="text-lg mb-6">
                          Welcome back, {Cookies.get("userName")}!
                        </p>
                        <p className="text-sm text-muted-foreground mb-8">
                          You'll be redirected to your dashboard in a moment...
                        </p>
                        <img
                          src="/assets/Congratulations.png"
                          alt="Success"
                          className="max-w-xs w-full object-contain"
                        />
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-col items-center justify-center">
                          <h2 className="text-2xl font-bold mb-4 tracking-tight">
                            Step Into Your Space
                          </h2>
                          <p className="text-xs text-center max-w-xs">
                            Unlock access to device management dashboard <br /> log-in to
                            get started!
                          </p>
                        </div>
                        <img
                          src="/assets/Welcome.png"
                          alt="Image"
                          className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                        />
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {!loginSuccess && (
                <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
                  By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
                  and <a href="#">Privacy Policy</a>.
                </div>
              )}
            </div>
          );
        }