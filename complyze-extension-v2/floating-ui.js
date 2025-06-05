console.log("Complyze: Floating UI script loading...");

class ComplyzeFloatingUI {
    constructor() {
        this.isOpen = false;
        this.sidebar = null;
        this.floatingIcon = null;
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.createFloatingUI());
        } else {
            this.createFloatingUI();
        }
    }

    createFloatingUI() {
        console.log("Complyze: Creating floating UI...");
        
        // Prevent multiple instances
        if (document.getElementById('complyze-floating-icon')) {
            console.log("Complyze: Floating UI already exists");
            return;
        }

        // Check if we're on a supported platform
        if (!this.isSupportedPlatform()) {
            console.log("Complyze: Not on a supported platform, skipping floating UI");
            return;
        }

        this.createFloatingIcon();
        this.createSidebar();
    }

    isSupportedPlatform() {
        const hostname = window.location.hostname;
        const supportedDomains = [
            'chat.openai.com',
            'chatgpt.com',
            'claude.ai',
            'gemini.google.com',
            'bard.google.com',
            'poe.com',
            'character.ai',
            'huggingface.co',
            'replicate.com',
            'cohere.ai',
            'complyze.co'
        ];
        
        return supportedDomains.some(domain => hostname.includes(domain));
    }

    calculateOptimalPosition() {
        // Default position
        let position = {
            top: '50%',
            right: '20px'
        };

        // Platform-specific adjustments
        const hostname = window.location.hostname;
        
        if (hostname.includes('chatgpt.com') || hostname.includes('chat.openai.com')) {
            // ChatGPT has elements on the right side, move icon further from edge
            position.right = '30px';
            position.top = '40%';
        } else if (hostname.includes('claude.ai')) {
            // Claude.ai layout considerations
            position.right = '25px';
            position.top = '45%';
        } else if (hostname.includes('gemini.google.com')) {
            // Gemini layout considerations
            position.right = '25px';
            position.top = '60%';
        }

        return position;
    }

    createFloatingIcon() {
        // Create fixed docked icon
        this.floatingIcon = document.createElement('div');
        this.floatingIcon.id = 'complyze-floating-icon';
        this.floatingIcon.setAttribute('role', 'button');
        this.floatingIcon.setAttribute('aria-label', 'Complyze Prompt Scanner');
        this.floatingIcon.setAttribute('tabindex', '0');
        this.floatingIcon.innerHTML = `
            <div class="complyze-icon-content">
                <div class="shield-icon">
                    <svg width="18" height="20" viewBox="0 0 100 110" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M50 5 C25 5, 10 15, 10 30 C10 50, 10 70, 50 105 C90 70, 90 50, 90 30 C90 15, 75 5, 50 5 Z" 
                              fill="#F97316" stroke="#EA580C" stroke-width="1"/>
                        <path d="M35 50 L45 60 L70 35" 
                              stroke="#1E40AF" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                    </svg>
                </div>
            </div>
            <div class="tooltip">Secure your prompt</div>
        `;
        
        // Fixed docked position - right edge, vertically centered
        this.floatingIcon.style.cssText = `
            position: fixed;
            top: 50%;
            right: -6px;
            transform: translateY(-50%);
            width: 36px;
            height: 36px;
            background: linear-gradient(135deg, #2D3748, #1A202C);
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            cursor: pointer;
            z-index: 2147483647;
            box-shadow: 
                -2px 0 8px rgba(0, 0, 0, 0.15),
                0 2px 16px rgba(0, 0, 0, 0.1);
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            align-items: center;
            justify-content: center;
            user-select: none;
            -webkit-user-select: none;
            backdrop-filter: blur(10px);
            border-right: none;
        `;

        // Icon content styles
        const iconContent = this.floatingIcon.querySelector('.complyze-icon-content');
        iconContent.style.cssText = `
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: none;
            transition: transform 0.25s ease;
        `;

        // Shield icon styles
        const shieldIcon = this.floatingIcon.querySelector('.shield-icon');
        shieldIcon.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            filter: drop-shadow(0 1px 3px rgba(249, 115, 22, 0.3));
            transition: all 0.25s ease;
        `;

        // Tooltip styles
        const tooltip = this.floatingIcon.querySelector('.tooltip');
        tooltip.style.cssText = `
            position: absolute;
            right: 44px;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(45, 55, 72, 0.95);
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 500;
            white-space: nowrap;
            opacity: 0;
            visibility: hidden;
            transition: all 0.25s ease;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        `;

        // Add arrow to tooltip
        const arrow = document.createElement('div');
        arrow.style.cssText = `
            position: absolute;
            right: -5px;
            top: 50%;
            transform: translateY(-50%);
            width: 0;
            height: 0;
            border-left: 5px solid rgba(45, 55, 72, 0.95);
            border-top: 5px solid transparent;
            border-bottom: 5px solid transparent;
        `;
        tooltip.appendChild(arrow);

        // Hover effects with smooth expansion
        this.floatingIcon.addEventListener('mouseenter', () => {
            // Expand icon
            this.floatingIcon.style.transform = 'translateY(-50%) translateX(-8px) scale(1.08)';
            this.floatingIcon.style.boxShadow = `
                -4px 0 16px rgba(0, 0, 0, 0.2),
                0 4px 24px rgba(0, 0, 0, 0.15),
                0 0 20px rgba(255, 193, 7, 0.2)
            `;
            this.floatingIcon.style.background = 'linear-gradient(135deg, #374151, #2D3748)';
            
            // Glow shield
            shieldIcon.style.filter = 'drop-shadow(0 0 8px rgba(249, 115, 22, 0.6))';
            shieldIcon.style.transform = 'scale(1.1)';
            
            // Show tooltip
            tooltip.style.opacity = '1';
            tooltip.style.visibility = 'visible';
            tooltip.style.transform = 'translateY(-50%) translateX(-4px)';
        });

        this.floatingIcon.addEventListener('mouseleave', () => {
            // Reset icon
            this.floatingIcon.style.transform = 'translateY(-50%)';
            this.floatingIcon.style.boxShadow = `
                -2px 0 8px rgba(0, 0, 0, 0.15),
                0 2px 16px rgba(0, 0, 0, 0.1)
            `;
            this.floatingIcon.style.background = 'linear-gradient(135deg, #2D3748, #1A202C)';
            
            // Reset shield
            shieldIcon.style.filter = 'drop-shadow(0 1px 3px rgba(249, 115, 22, 0.3))';
            shieldIcon.style.transform = 'scale(1)';
            
            // Hide tooltip
            tooltip.style.opacity = '0';
            tooltip.style.visibility = 'hidden';
            tooltip.style.transform = 'translateY(-50%)';
        });

        // Click handler
        this.floatingIcon.addEventListener('click', () => {
            this.toggleSidebar();
        });

        // Keyboard accessibility
        this.floatingIcon.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.toggleSidebar();
            }
        });

        // Focus styles for accessibility
        this.floatingIcon.addEventListener('focus', () => {
            this.floatingIcon.style.outline = '2px solid #F97316';
            this.floatingIcon.style.outlineOffset = '2px';
        });

        this.floatingIcon.addEventListener('blur', () => {
            this.floatingIcon.style.outline = 'none';
        });

        document.body.appendChild(this.floatingIcon);
        console.log("Complyze: Fixed docked icon created");
    }

    createSidebar() {
        // Create sidebar container
        this.sidebar = document.createElement('div');
        this.sidebar.id = 'complyze-sidebar';
        this.sidebar.style.cssText = `
            position: fixed;
            top: 0;
            right: -400px;
            width: 400px;
            height: 100vh;
            background: #FAFBFC;
            border-left: 1px solid #E5E7EB;
            z-index: 2147483646;
            transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            overflow-y: auto;
            box-shadow: -8px 0 24px rgba(0, 0, 0, 0.08), -2px 0 8px rgba(0, 0, 0, 0.04);
            backdrop-filter: blur(10px);
        `;

        // Create close button
        const closeButton = document.createElement('div');
        closeButton.innerHTML = '×';
        closeButton.setAttribute('role', 'button');
        closeButton.setAttribute('aria-label', 'Close panel');
        closeButton.setAttribute('tabindex', '0');
        closeButton.style.cssText = `
            position: absolute;
            top: 16px;
            right: 16px;
            width: 32px;
            height: 32px;
            background: rgba(107, 114, 128, 0.08);
            color: #6B7280;
            border: 1px solid rgba(107, 114, 128, 0.12);
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            font-weight: 500;
            z-index: 999999;
            transition: all 0.25s ease;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        `;

        closeButton.addEventListener('mouseenter', () => {
            closeButton.style.background = 'rgba(107, 114, 128, 0.12)';
            closeButton.style.color = '#374151';
            closeButton.style.transform = 'scale(1.05)';
            closeButton.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
        });

        closeButton.addEventListener('mouseleave', () => {
            closeButton.style.background = 'rgba(107, 114, 128, 0.08)';
            closeButton.style.color = '#6B7280';
            closeButton.style.transform = 'scale(1)';
            closeButton.style.boxShadow = 'none';
        });

        closeButton.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.closeSidebar();
            }
        });

        closeButton.addEventListener('click', () => {
            this.closeSidebar();
        });

        // Create content container
        const contentContainer = document.createElement('div');
        contentContainer.className = 'complyze-sidebar-content';
        contentContainer.style.cssText = `
            width: 100%;
            height: 100%;
            padding-top: 50px;
            background: #FAFBFC;
        `;
        
        // Load popup content directly
        this.loadPopupContent(contentContainer);
        
        this.sidebar.appendChild(closeButton);
        this.sidebar.appendChild(contentContainer);
        document.body.appendChild(this.sidebar);
        
        console.log("Complyze: Sidebar created");
    }

    async loadPopupContent(container) {
        console.log("Complyze: Loading popup content...");
        
        try {
            // Check if user is authenticated
            const isLoggedIn = await this.checkLoginStatus();
            console.log("Complyze: Login status:", isLoggedIn);
            
            if (isLoggedIn) {
                // Show main interface for authenticated users
                this.showMainInterface(container);
            } else {
                // Show login screen for unauthenticated users
                console.log("Complyze: User not authenticated, showing login screen");
                this.showLoginScreen(container);
            }
        } catch (error) {
            console.error("Complyze: Error loading popup content:", error);
            // Fallback to login screen on error
            this.showLoginScreen(container);
        }
    }

    async checkLoginStatus() {
        try {
            // Check for stored auth token
            const result = await chrome.storage.local.get(['complyze_token', 'complyze_user']);
            return !!(result.complyze_token && result.complyze_user);
        } catch (error) {
            console.error("Complyze: Error checking login status:", error);
            return false;
        }
    }

    showLoginScreen(container) {
        container.innerHTML = `
            <div style="
                background: #FAFBFC;
                height: 100%;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
            ">
                <!-- Header -->
                <div style="padding: 24px 24px 16px 24px; border-bottom: 1px solid #E5E7EB;">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                        <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #f97316, #ea580c); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; color: white; font-weight: bold;">C</div>
                        <div>
                            <h1 style="margin: 0; color: #2E2E2E; font-size: 22px; font-weight: 700;">Complyze</h1>
                            <p style="margin: 2px 0 0 0; color: #6B7280; font-size: 14px; font-weight: 500;">AI Prompt Security & Governance</p>
                        </div>
                    </div>
                    
                    <!-- About Section -->
                    <div style="margin-bottom: 16px;">
                        <p style="margin: 0; color: #6B7280; font-size: 14px; line-height: 1.5;">
                            Complyze helps individuals and enterprises safely use LLMs like ChatGPT by detecting and redacting sensitive information in real time.
                        </p>
                    </div>

                    <!-- Tags -->
                    <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px;">
                        <span style="background: #EEF2FF; color: #4F46E5; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">AI Security</span>
                        <span style="background: #F0FDF4; color: #16A34A; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">Prompt Compliance</span>
                        <span style="background: #FEF2F2; color: #DC2626; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">Data Loss Prevention</span>
                        <span style="background: #FFF7ED; color: #EA580C; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">Governance Tools</span>
                    </div>

                    <!-- Spacer -->
                    <div style="margin-bottom: 8px;"></div>
                </div>

                <!-- Login Form -->
                <div style="padding: 24px;">
                    <div style="background: white; border: 1px solid #E5E7EB; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
                        <h2 style="margin: 0 0 16px 0; color: #2E2E2E; font-size: 18px; font-weight: 600; text-align: center;">Welcome to Complyze</h2>
                        <p style="margin: 0 0 20px 0; color: #6B7280; font-size: 14px; text-align: center; line-height: 1.4;">
                            Sign in to access advanced security features and real-time prompt protection.
                        </p>
                        
                        <form id="complyze-login-form">
                            <div style="margin-bottom: 16px;">
                                <label style="display: block; margin-bottom: 6px; color: #374151; font-size: 14px; font-weight: 500;">Email</label>
                                <input type="email" id="login-email" required style="
                                    width: 100%; 
                                    padding: 10px 12px; 
                                    border: 1px solid #D1D5DB; 
                                    border-radius: 6px; 
                                    font-size: 14px; 
                                    transition: border-color 0.2s ease;
                                    box-sizing: border-box;
                                    outline: none;
                                    -webkit-appearance: none;
                                    background: white;
                                    color: #000000;
                                    -webkit-text-fill-color: #000000;
                                    opacity: 1;
                                " placeholder="your@email.com">
                            </div>
                            
                            <div style="margin-bottom: 20px;">
                                <label style="display: block; margin-bottom: 6px; color: #374151; font-size: 14px; font-weight: 500;">Password</label>
                                <input type="password" id="login-password" required style="
                                    width: 100%; 
                                    padding: 10px 12px; 
                                    border: 1px solid #D1D5DB; 
                                    border-radius: 6px; 
                                    font-size: 14px; 
                                    transition: border-color 0.2s ease;
                                    box-sizing: border-box;
                                    outline: none;
                                    -webkit-appearance: none;
                                    background: white;
                                    color: #000000;
                                    -webkit-text-fill-color: #000000;
                                    opacity: 1;
                                " placeholder="••••••••">
                            </div>
                            
                            <button type="submit" id="login-submit" style="
                                width: 100%; 
                                padding: 12px; 
                                background: #f97316; 
                                color: white; 
                                border: none; 
                                border-radius: 8px; 
                                font-size: 14px; 
                                font-weight: 600; 
                                cursor: pointer; 
                                transition: background-color 0.2s ease;
                                margin-bottom: 12px;
                            ">
                                Sign In
                            </button>
                            
                            <div style="text-align: center;">
                                <a href="https://complyze.co/signup" target="_blank" style="color: #f97316; text-decoration: none; font-size: 13px;">
                                    Don't have an account? Sign up
                                </a>
                            </div>
                        </form>
                        
                        <div id="login-error" style="
                            margin-top: 16px; 
                            padding: 12px; 
                            background: #FEF2F2; 
                            border: 1px solid #FECACA; 
                            border-radius: 6px; 
                            color: #B91C1C; 
                            font-size: 13px;
                            display: none;
                        "></div>
                    </div>
                    
                    <!-- Demo Mode -->
                    <div style="margin-top: 16px; text-align: center;">
                        <button id="demo-mode" style="
                            background: none; 
                            border: none; 
                            color: #6B7280; 
                            font-size: 13px; 
                            cursor: pointer; 
                            text-decoration: underline;
                        ">
                            Continue in demo mode
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add event handlers
        this.setupLoginHandlers(container);
        
        // Auto-focus email field after a short delay
        setTimeout(() => {
            const emailInput = document.getElementById('login-email');
            if (emailInput) {
                emailInput.focus();
            }
        }, 200);
        
        // Add focus/blur event handlers for better input styling
        const inputs = container.querySelectorAll('input[type="email"], input[type="password"]');
        inputs.forEach(input => {
            // Ensure inputs are properly enabled
            input.removeAttribute('disabled');
            input.removeAttribute('readonly');
            
            // Force black text styling and remove autofill styling
            const forceBlackText = () => {
                input.style.color = '#000000';
                input.style.webkitTextFillColor = '#000000';
                input.style.backgroundColor = 'white';
                input.style.backgroundImage = 'none';
            };
            
            forceBlackText();
            
            input.addEventListener('focus', (e) => {
                e.target.style.borderColor = '#f97316';
                e.target.style.boxShadow = '0 0 0 3px rgba(249, 115, 22, 0.1)';
                forceBlackText();
                // Force focus for better input handling
                setTimeout(() => e.target.focus(), 10);
            });
            
            input.addEventListener('blur', (e) => {
                e.target.style.borderColor = '#D1D5DB';
                e.target.style.boxShadow = 'none';
                forceBlackText();
            });
            
            // Add explicit input event handlers
            input.addEventListener('input', (e) => {
                forceBlackText();
                console.log('Input detected:', e.target.type, e.target.value);
            });
            
            input.addEventListener('keydown', (e) => {
                // Ensure normal typing behavior
                e.stopPropagation();
            });
            
            // Force black text after autofill
            input.addEventListener('animationstart', (e) => {
                if (e.animationName === 'onAutoFillStart') {
                    forceBlackText();
                }
            });
        });
    }

    showMainInterface(container) {
        container.innerHTML = `
            <div style="
                background: #FAFBFC;
                height: 100%;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
            ">
                <!-- Header -->
                <div style="padding: 24px 24px 16px 24px; border-bottom: 1px solid #E5E7EB;">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                        <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #f97316, #ea580c); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; color: white; font-weight: bold;">C</div>
                        <div style="flex: 1;">
                            <h1 style="margin: 0; color: #2E2E2E; font-size: 22px; font-weight: 700;">Complyze</h1>
                            <p style="margin: 2px 0 0 0; color: #6B7280; font-size: 14px; font-weight: 500;">AI Prompt Security & Governance</p>
                        </div>
                        <button id="logout-btn" style="
                            background: none; 
                            border: 1px solid #D1D5DB; 
                            color: #6B7280; 
                            padding: 6px 12px; 
                            border-radius: 6px; 
                            font-size: 12px; 
                            cursor: pointer;
                        ">Logout</button>
                    </div>
                    
                    <!-- Status -->
                    <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="color: #16A34A; font-size: 14px;">🟢</span>
                            <span style="color: #166534; font-size: 13px; font-weight: 500;">Protection Active</span>
                        </div>
                        <p style="margin: 4px 0 0 0; color: #16A34A; font-size: 12px;">
                            Monitoring prompts for sensitive information
                        </p>
                    </div>

                    <!-- Quick Stats -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                        <div style="background: white; border: 1px solid #E5E7EB; border-radius: 8px; padding: 12px; text-align: center;">
                            <div style="color: #f97316; font-size: 18px; font-weight: 700;">24</div>
                            <div style="color: #6B7280; font-size: 11px;">Prompts Protected</div>
                        </div>
                        <div style="background: white; border: 1px solid #E5E7EB; border-radius: 8px; padding: 12px; text-align: center;">
                            <div style="color: #DC2626; font-size: 18px; font-weight: 700;">3</div>
                            <div style="color: #6B7280; font-size: 11px;">Risks Blocked</div>
                        </div>
                    </div>

                    <!-- Tags -->
                    <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                        <span style="background: #EEF2FF; color: #4F46E5; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">AI Security</span>
                        <span style="background: #F0FDF4; color: #16A34A; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">Prompt Compliance</span>
                        <span style="background: #FEF2F2; color: #DC2626; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">Data Loss Prevention</span>
                        <span style="background: #FFF7ED; color: #EA580C; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">Governance Tools</span>
                    </div>
                </div>

                <!-- Content -->
                <div style="padding: 24px;">
                    <div style="background: white; border: 1px solid #E5E7EB; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
                        <h3 style="margin: 0 0 12px 0; color: #2E2E2E; font-size: 16px; font-weight: 600;">Settings</h3>
                        
                        <div style="margin-bottom: 16px;">
                            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                <input type="checkbox" id="auto-block" checked style="margin: 0;">
                                <span style="color: #374151; font-size: 14px;">Auto-block sensitive prompts</span>
                            </label>
                        </div>
                        
                        <div style="margin-bottom: 16px;">
                            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                <input type="checkbox" id="notifications" checked style="margin: 0;">
                                <span style="color: #374151; font-size: 14px;">Show security notifications</span>
                            </label>
                        </div>
                        
                        <div style="margin-bottom: 16px;">
                            <label style="display: block; margin-bottom: 6px; color: #374151; font-size: 14px; font-weight: 500;">Sensitivity Level</label>
                            <select id="sensitivity-level" style="
                                width: 100%; 
                                padding: 8px 12px; 
                                border: 1px solid #D1D5DB; 
                                border-radius: 6px; 
                                font-size: 14px;
                                box-sizing: border-box;
                            ">
                                <option value="low">Low - Basic PII only</option>
                                <option value="medium" selected>Medium - Standard protection</option>
                                <option value="high">High - Maximum security</option>
                            </select>
                        </div>
                    </div>
                    
                    <!-- Help Section -->
                    <div style="background: #EEF2FF; border: 1px solid #C7D2FE; border-radius: 8px; padding: 16px;">
                        <h4 style="margin: 0 0 8px 0; color: #4338CA; font-size: 14px; font-weight: 600;">💡 How it works</h4>
                        <p style="margin: 0; color: #4F46E5; font-size: 12px; line-height: 1.4;">
                            Complyze automatically scans your prompts before they're sent to AI services, detecting and redacting sensitive information like emails, phone numbers, and API keys.
                        </p>
                    </div>
                </div>
            </div>
        `;

        // Add event handlers
        this.setupMainInterfaceHandlers(container);
    }

    addSidebarStyles(container) {
        // Create a style element for sidebar-specific adjustments
        const style = document.createElement('style');
        style.textContent = `
            /* Reset styles for sidebar content */
            #complyze-sidebar * {
                box-sizing: border-box;
            }
            
            /* Adjust body styles for sidebar */
            #complyze-sidebar body {
                width: 100% !important;
                min-height: auto !important;
                margin: 0 !important;
                padding: 0 !important;
                border: none !important;
                border-radius: 0 !important;
                box-shadow: none !important;
            }
            
            /* Make content fit sidebar width */
            #complyze-sidebar .content {
                padding: 15px !important;
            }
            
            /* Adjust header for sidebar */
            #complyze-sidebar .header {
                padding: 15px !important;
                margin-top: 0 !important;
            }
            
            /* Ensure buttons work properly */
            #complyze-sidebar .button {
                width: 100% !important;
                margin-bottom: 8px !important;
            }
            
            /* Scrollbar styling for webkit browsers */
            #complyze-sidebar::-webkit-scrollbar {
                width: 8px;
            }
            
            #complyze-sidebar::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.1);
            }
            
            #complyze-sidebar::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.3);
                border-radius: 4px;
            }
            
            #complyze-sidebar::-webkit-scrollbar-thumb:hover {
                background: rgba(255, 255, 255, 0.5);
            }
        `;
        
        // Add the style to the container
        container.appendChild(style);
    }

    toggleSidebar() {
        if (this.isOpen) {
            this.closeSidebar();
        } else {
            this.openSidebar();
        }
    }

    openSidebar() {
        if (this.sidebar) {
            this.sidebar.style.right = '0';
            this.isOpen = true;
            console.log("Complyze: Sidebar opened");
            
            // Animate floating icon to indicate sidebar is open
            this.floatingIcon.style.right = '420px';
            this.floatingIcon.style.background = 'linear-gradient(135deg, #dc2626, #b91c1c)';
        }
    }

    closeSidebar() {
        if (this.sidebar) {
            this.sidebar.style.right = '-400px';
            this.isOpen = false;
            console.log("Complyze: Sidebar closed");
            
            // Reset floating icon position and color
            const optimalPosition = this.calculateOptimalPosition();
            this.floatingIcon.style.right = optimalPosition.right;
            this.floatingIcon.style.background = 'linear-gradient(135deg, #f97316, #ea580c)';
        }
    }

    // Handle escape key to close sidebar
    handleEscapeKey(event) {
        if (event.key === 'Escape' && this.isOpen) {
            this.closeSidebar();
        }
    }

    // New method to show security alert in sidebar
    showSecurityAlert(analysis, originalPrompt) {
        console.log('Complyze: Showing security alert in floating sidebar');
        
        // Clear any existing alert popups first
        this.clearAllAlertPopups();
        
        if (!this.sidebar) {
            console.error('Complyze: Sidebar not found');
            return;
        }

        // Open sidebar
        this.openSidebar();

        const sidebarContent = this.sidebar.querySelector('.complyze-sidebar-content');
        if (!sidebarContent) {
            console.error('Complyze: Sidebar content not found');
            return;
        }

        // Create new Apollo-style security alert
        const securityAlert = document.createElement('div');
        securityAlert.id = 'complyze-security-alert';
        
        securityAlert.style.cssText = `
            background: #FAFBFC;
            color: #2E2E2E;
            border-radius: 0;
            margin: 0;
            padding: 0;
            height: 100%;
            overflow-y: auto;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
        `;

        securityAlert.innerHTML = `
            <!-- Company Header -->
            <div style="padding: 24px 24px 16px 24px; border-bottom: 1px solid #E5E7EB;">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                    <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #f97316, #ea580c); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; color: white; font-weight: bold;">C</div>
                    <div>
                        <h1 style="margin: 0; color: #2E2E2E; font-size: 22px; font-weight: 700;">Complyze</h1>
                        <p style="margin: 2px 0 0 0; color: #6B7280; font-size: 14px; font-weight: 500;">AI Prompt Security & Governance</p>
                    </div>
                </div>
                
                <!-- About Section -->
                <div style="margin-bottom: 16px;">
                    <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #2E2E2E;">🔐 Sensitive Info Blocked</h3>
                    <p style="margin: 0; color: #6B7280; font-size: 14px; line-height: 1.4;">
                        Your prompt contained sensitive content. We've safely removed it and improved the phrasing.
                    </p>
                </div>

                <!-- Tags -->
                <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px;">
                    <span style="background: #EEF2FF; color: #4F46E5; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">AI Security</span>
                    <span style="background: #F0FDF4; color: #16A34A; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">Prompt Compliance</span>
                    <span style="background: #FEF2F2; color: #DC2626; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">Data Loss Prevention</span>
                    <span style="background: #FFF7ED; color: #EA580C; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">Governance Tools</span>
                </div>

                <!-- Location and Company Info -->
                <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 8px;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span style="font-size: 14px;">📍</span>
                        <span style="color: #6B7280; font-size: 13px;">Remote-first</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span style="font-size: 14px;">👥</span>
                        <span style="color: #6B7280; font-size: 13px;">Bootstrapped Startup</span>
                    </div>
                </div>
            </div>

            <!-- Security Alert Content -->
            <div style="padding: 20px 24px;">
                <!-- Detected Issues -->
                <div style="background: #F8D7DA; border: 1px solid #F5C6CB; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                        <h3 style="margin: 0; color: #721C24; font-size: 14px; font-weight: 600;">Detected Issues</h3>
                        <button style="background: none; border: none; color: #6B7280; cursor: pointer; font-size: 12px;" title="Why was this flagged?">❓</button>
                    </div>
                    <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                        ${analysis.detectedPII.map(type => `
                            <span style="background: rgba(220, 38, 38, 0.1); color: #DC2626; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; border: 1px solid rgba(220, 38, 38, 0.2);">
                                ${type.toUpperCase()}
                            </span>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Optimized Prompt -->
                <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                    <h3 style="margin: 0 0 12px 0; color: #166534; font-size: 14px; font-weight: 600;">✅ Secure Version</h3>
                    <div id="optimized-prompt-text" style="background: white; border: 1px solid #D1D5DB; border-radius: 6px; padding: 12px; font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace; font-size: 12px; line-height: 1.5; color: #374151; max-height: 120px; overflow-y: auto; white-space: pre-wrap; word-break: break-word;">
                        ${analysis.optimized_prompt || this.createLoadingAnimation()}
                    </div>
                    
                    <!-- Redaction Insights -->
                    <div style="margin-top: 12px;">
                        <div style="background: #EEF2FF; border-left: 3px solid #4F46E5; padding: 8px 12px; border-radius: 4px;">
                            <div style="font-size: 11px; color: #4338CA; font-weight: 600; margin-bottom: 2px;">REDACTION INSIGHT</div>
                            <div style="font-size: 12px; color: #6366F1;">Sensitive identifiers replaced with privacy-safe alternatives</div>
                        </div>
                    </div>
                </div>
                
                <!-- Action Buttons -->
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <button id="complyze-use-optimized" style="
                        padding: 12px 16px; 
                        background: #3EB489; 
                        color: white; 
                        border: none; 
                        border-radius: 8px; 
                        cursor: pointer; 
                        font-size: 14px; 
                        font-weight: 600;
                        transition: all 0.2s ease;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                    ">
                        ✅ Use Secure Version
                    </button>
                    <button id="complyze-copy-optimized" style="
                        padding: 12px 16px; 
                        background: #FFA552; 
                        color: white; 
                        border: none; 
                        border-radius: 8px; 
                        cursor: pointer; 
                        font-size: 14px; 
                        font-weight: 600;
                        transition: all 0.2s ease;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                    ">
                        📋 Copy Cleaned Prompt
                    </button>
                    <button id="complyze-send-anyway" style="
                        padding: 10px 16px; 
                        background: rgba(239, 68, 68, 0.1); 
                        color: #EF4444; 
                        border: 1px solid rgba(239, 68, 68, 0.2); 
                        border-radius: 8px; 
                        cursor: pointer; 
                        font-size: 13px; 
                        font-weight: 500;
                        transition: all 0.2s ease;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                        opacity: 0.8;
                    ">
                        ⚠️ Send Risky Prompt Anyway
                    </button>
                    <button id="complyze-cancel-alert" style="
                        padding: 8px 16px; 
                        background: transparent; 
                        color: #6B7280; 
                        border: 1px solid #D1D5DB; 
                        border-radius: 6px; 
                        cursor: pointer; 
                        font-size: 12px;
                        transition: all 0.2s ease;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">
                        Cancel
                    </button>
                </div>
            </div>
        `;

        // Clear existing content and add security alert
        sidebarContent.innerHTML = '';
        sidebarContent.appendChild(securityAlert);

        // Add button event handlers
        this.setupSecurityAlertHandlers(analysis, originalPrompt);
        
        // Add hover effects
        this.addButtonHoverEffects();
    }

    createLoadingAnimation() {
        return `<div style="display: flex; align-items: center; gap: 8px; color: #6B7280;">
            <div style="width: 8px; height: 8px; background: #6B7280; border-radius: 50%; animation: pulse 1.5s ease-in-out infinite;"></div>
            <div style="width: 8px; height: 8px; background: #6B7280; border-radius: 50%; animation: pulse 1.5s ease-in-out infinite; animation-delay: 0.2s;"></div>
            <div style="width: 8px; height: 8px; background: #6B7280; border-radius: 50%; animation: pulse 1.5s ease-in-out infinite; animation-delay: 0.4s;"></div>
            <span style="margin-left: 8px; font-size: 12px;">Optimizing prompt...</span>
        </div>
        <style>
            @keyframes pulse {
                0%, 80%, 100% { opacity: 0.3; }
                40% { opacity: 1; }
            }
            
            /* Override autofill styling */
            input:-webkit-autofill,
            input:-webkit-autofill:hover,
            input:-webkit-autofill:focus,
            input:-webkit-autofill:active {
                -webkit-box-shadow: 0 0 0 30px white inset !important;
                -webkit-text-fill-color: #000000 !important;
                color: #000000 !important;
                background-color: white !important;
            }
            
            input[type="email"], input[type="password"] {
                color: #000000 !important;
                -webkit-text-fill-color: #000000 !important;
            }
        </style>`;
    }

    setupLoginHandlers(container) {
        const loginForm = document.getElementById('complyze-login-form');
        const demoButton = document.getElementById('demo-mode');
        const errorDiv = document.getElementById('login-error');

        loginForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const emailInput = document.getElementById('login-email');
            const passwordInput = document.getElementById('login-password');
            const submitBtn = document.getElementById('login-submit');
            
            const email = emailInput?.value?.trim();
            const password = passwordInput?.value?.trim();
            
            console.log('Login attempt:', { email, passwordLength: password?.length });
            
            if (!email || !password) {
                errorDiv.textContent = 'Please enter both email and password';
                errorDiv.style.display = 'block';
                return;
            }
            
            // Show loading state
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = 'Signing In...';
            submitBtn.disabled = true;
            errorDiv.style.display = 'none';
            
            try {
                console.log('Calling Supabase Auth API...');
                const response = await fetch('https://complyze.co/api/auth/supabase', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-Client-Info': 'extension-v2.3.1'
                    },
                    body: JSON.stringify({ 
                        email: email,
                        password: password,
                        gotrue_meta_security: { captcha_token: null },
                        options: {
                            data: {
                                source: 'extension'
                            }
                        }
                    })
                });

                console.log('API Response:', response.status, response.statusText);
                console.log('Response headers:', [...response.headers.entries()]);

                if (response.ok) {
                    const data = await response.json();
                    console.log('Login successful - raw response:', data);
                    
                    // Handle Supabase auth response format
                    const { session, user } = data;
                    const token = session?.access_token;
                    
                    console.log('Supabase auth response:', { 
                        hasSession: !!session,
                        hasToken: !!token,
                        hasUser: !!user,
                        userId: user?.id,
                        userEmail: user?.email
                    });
                    
                    if (token && user?.id) {
                        await chrome.storage.local.set({
                            complyze_token: token,
                            complyze_user: user,
                            complyze_session: session,
                            complyze_login_time: Date.now()
                        });
                        
                        console.log('Login data stored successfully');
                        // Reload interface to show main view
                        this.showMainInterface(container);
                    } else {
                        console.error('Invalid response format - missing token or user:', { token: !!token, user: !!user });
                        console.error('Full response data:', data);
                        errorDiv.textContent = 'Login response missing required data';
                        errorDiv.style.display = 'block';
                    }
                } else {
                    const errorData = await response.json();
                    console.error('Supabase auth error:', errorData);
                    
                    // Handle Supabase error format
                    const supabaseError = errorData.error || {};
                    const errorMessage = supabaseError.message || 'Authentication failed';
                    
                    // Map common Supabase errors to user-friendly messages
                    const userMessage = {
                        'Invalid login credentials': 'Invalid email or password',
                        'Email not confirmed': 'Please verify your email first',
                        'User not found': 'No account found with this email',
                        'Invalid email or password': 'Invalid email or password'
                    }[errorMessage] || errorMessage;
                    
                    errorDiv.textContent = userMessage;
                    errorDiv.style.display = 'block';
                }
            } catch (error) {
                console.error('Network error details:', error);
                console.error('Error name:', error.name);
                console.error('Error message:', error.message);
                
                // Try alternative endpoint if CORS error
                if (error.name === 'TypeError' && error.message.includes('fetch')) {
                    console.log('Trying alternative auth endpoint...');
                    try {
                        const altResponse = await fetch('https://complyze.co/api/auth/check', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json',
                            },
                            body: JSON.stringify({ 
                                email: email,
                                password: password,
                                action: 'login'
                            })
                        });
                        
                        if (altResponse.ok) {
                            const data = await altResponse.json();
                            console.log('Alternative login successful:', data);
                            
                            // Store login data
                            await chrome.storage.local.set({
                                complyze_token: data.token || 'demo_token',
                                complyze_user: data.user || { email: email },
                                complyze_session: data,
                                complyze_login_time: Date.now()
                            });
                            
                            this.showMainInterface(container);
                            return;
                        }
                    } catch (altError) {
                        console.error('Alternative login also failed:', altError);
                    }
                }
                
                errorDiv.textContent = 'Network error. Please check your connection and try again.';
                errorDiv.style.display = 'block';
            } finally {
                // Reset button state
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });

        demoButton?.addEventListener('click', async () => {
            // Set demo mode
            await chrome.storage.local.set({
                complyze_token: 'demo',
                complyze_user: { name: 'Demo User', email: 'demo@complyze.co' }
            });
            
            this.showMainInterface(container);
        });
    }

    setupMainInterfaceHandlers(container) {
        const logoutBtn = document.getElementById('logout-btn');
        const autoBlock = document.getElementById('auto-block');
        const notifications = document.getElementById('notifications');
        const sensitivityLevel = document.getElementById('sensitivity-level');

        logoutBtn?.addEventListener('click', async () => {
            await chrome.storage.local.remove(['complyze_token', 'complyze_user']);
            this.showLoginScreen(container);
        });

        // Save settings when changed and sync with dashboard
        autoBlock?.addEventListener('change', async () => {
            const setting = { autoBlock: autoBlock.checked };
            await chrome.storage.local.set(setting);
            await this.syncSettingToAPI('autoBlock', autoBlock.checked);
            console.log('Auto-block setting updated:', autoBlock.checked);
        });

        notifications?.addEventListener('change', async () => {
            const setting = { notifications: notifications.checked };
            await chrome.storage.local.set(setting);
            await this.syncSettingToAPI('notifications', notifications.checked);
            console.log('Notifications setting updated:', notifications.checked);
        });

        sensitivityLevel?.addEventListener('change', async () => {
            const setting = { sensitivityLevel: sensitivityLevel.value };
            await chrome.storage.local.set(setting);
            await this.syncSettingToAPI('sensitivityLevel', sensitivityLevel.value);
            console.log('Sensitivity level updated:', sensitivityLevel.value);
        });

        // Load settings from API for real-time sync
        this.loadSettingsFromAPI();
    }

    async loadSettings() {
        try {
            const settings = await chrome.storage.local.get(['autoBlock', 'notifications', 'sensitivityLevel']);
            
            const autoBlock = document.getElementById('auto-block');
            const notifications = document.getElementById('notifications');
            const sensitivityLevel = document.getElementById('sensitivity-level');

            if (autoBlock && settings.autoBlock !== undefined) {
                autoBlock.checked = settings.autoBlock;
            }
            if (notifications && settings.notifications !== undefined) {
                notifications.checked = settings.notifications;
            }
            if (sensitivityLevel && settings.sensitivityLevel) {
                sensitivityLevel.value = settings.sensitivityLevel;
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    setupSecurityAlertHandlers(analysis, originalPrompt) {
        // Copy optimized button
        document.getElementById('complyze-copy-optimized')?.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(analysis.optimized_prompt);
                const button = document.getElementById('complyze-copy-optimized');
                const originalText = button.innerHTML;
                button.innerHTML = '✅ Copied!';
                button.style.background = '#10b981';
                setTimeout(() => {
                    button.innerHTML = originalText;
                    button.style.background = '#FFA552';
                }, 2000);
            } catch (err) {
                console.error('Failed to copy:', err);
            }
        });

        // Use optimized button
        document.getElementById('complyze-use-optimized')?.addEventListener('click', () => {
            this.replacePromptText(analysis.optimized_prompt);
            this.markPromptAsSafe(analysis.optimized_prompt);
            this.closeSidebar();
            this.allowSubmission();
        });

        // Send anyway button
        document.getElementById('complyze-send-anyway')?.addEventListener('click', () => {
            this.markPromptAsSafe(originalPrompt);
            this.closeSidebar();
            this.allowSubmission();
        });

        // Cancel button
        document.getElementById('complyze-cancel-alert')?.addEventListener('click', () => {
            this.closeSidebar();
        });
    }

    addButtonHoverEffects() {
        const buttons = document.querySelectorAll('#complyze-security-alert button');
        buttons.forEach(button => {
            button.addEventListener('mouseenter', () => {
                button.style.transform = 'translateY(-1px)';
                button.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.transform = 'translateY(0)';
                button.style.boxShadow = 'none';
            });
        });
    }

    replacePromptText(newText) {
        const inputElement = document.querySelector('div[contenteditable="true"]') || 
                            document.querySelector('textarea');
        
        if (inputElement) {
            if (inputElement.textContent !== undefined) {
                inputElement.textContent = newText;
            } else {
                inputElement.value = newText;
            }
            
            // Trigger input event
            inputElement.dispatchEvent(new Event('input', { bubbles: true }));
            
            // Focus the input
            inputElement.focus();
        }
    }

    markPromptAsSafe(promptText) {
        // Notify the content script that this prompt is safe
        if (window.complyzeStable) {
            window.complyzeStable.markPromptAsSafe(promptText);
        }
    }

    allowSubmission() {
        // Notify the content script to allow submission
        if (window.complyzeStable) {
            window.complyzeStable.allowSubmission();
        }
    }

    // Clear all types of alert popups and overlays
    clearAllAlertPopups() {
        console.log('Complyze: Clearing all alert popups');
        
        // Remove real-time warning overlays
        const existingWarnings = document.querySelectorAll('[id*="complyze-warning"], [class*="complyze-warning"], [id*="realtime-warning"], [class*="realtime-warning"]');
        existingWarnings.forEach(warning => {
            console.log('Complyze: Removing warning element:', warning.id || warning.className);
            warning.remove();
        });
        
        // Remove any modal overlays
        const modalOverlays = document.querySelectorAll('[id*="complyze-modal"], [class*="complyze-modal"], [id*="safe-prompt-panel"], [class*="safe-prompt-panel"]');
        modalOverlays.forEach(modal => {
            console.log('Complyze: Removing modal element:', modal.id || modal.className);
            modal.remove();
        });
        
        // Remove any temporary notification elements
        const notifications = document.querySelectorAll('[id*="complyze-notification"], [class*="complyze-notification"]');
        notifications.forEach(notification => {
            console.log('Complyze: Removing notification element:', notification.id || notification.className);
            notification.remove();
        });
        
        // Remove any backdrop/overlay elements
        const backdrops = document.querySelectorAll('[style*="backdrop-filter"], [style*="position: fixed"][style*="z-index"]');
        backdrops.forEach(backdrop => {
            if (backdrop.id && backdrop.id.includes('complyze')) {
                console.log('Complyze: Removing backdrop element:', backdrop.id);
                backdrop.remove();
            }
        });
        
        console.log('Complyze: Alert popup clearing complete');
    }

    // Sync settings to API for dashboard integration
    async syncSettingToAPI(settingKey, value) {
        try {
            const storage = await chrome.storage.local.get(['complyze_token']);
            if (!storage.complyze_token || storage.complyze_token === 'demo') {
                console.log('Skipping API sync - demo mode or no token');
                return;
            }

            console.log(`Syncing setting ${settingKey} = ${value} to API`);
            
            const response = await fetch('https://complyze.co/api/user/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${storage.complyze_token}`,
                },
                body: JSON.stringify({
                    setting_key: settingKey,
                    setting_value: value,
                    source: 'extension'
                })
            });

            if (response.ok) {
                console.log(`Setting ${settingKey} synced successfully`);
            } else {
                console.error(`Failed to sync setting ${settingKey}:`, response.status);
            }
        } catch (error) {
            console.error(`Error syncing setting ${settingKey}:`, error);
        }
    }

    // Load settings from API for real-time sync
    async loadSettingsFromAPI() {
        try {
            const storage = await chrome.storage.local.get(['complyze_token']);
            if (!storage.complyze_token || storage.complyze_token === 'demo') {
                console.log('Loading local settings - demo mode or no token');
                return await this.loadSettings();
            }

            console.log('Loading settings from API...');
            
            const response = await fetch('https://complyze.co/api/user/settings', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${storage.complyze_token}`,
                }
            });

            if (response.ok) {
                const apiSettings = await response.json();
                console.log('API settings loaded:', apiSettings);
                
                // Merge API settings with local storage
                await chrome.storage.local.set({
                    autoBlock: apiSettings.autoBlock ?? true,
                    notifications: apiSettings.notifications ?? true,
                    sensitivityLevel: apiSettings.sensitivityLevel ?? 'medium'
                });
                
                // Update UI
                this.loadSettings();
            } else {
                console.error('Failed to load settings from API:', response.status);
                // Fallback to local settings
                this.loadSettings();
            }
        } catch (error) {
            console.error('Error loading settings from API:', error);
            // Fallback to local settings
            this.loadSettings();
        }
    }


}

// Initialize the floating UI when the script loads
document.addEventListener('keydown', (event) => {
    if (window.complyzeFloatingUI) {
        window.complyzeFloatingUI.handleEscapeKey(event);
    }
});

// Make the class globally available immediately
window.ComplyzeFloatingUI = ComplyzeFloatingUI;

// Ensure initialization happens reliably
const initializeFloatingUI = () => {
    try {
        if (!window.complyzeFloatingUI) {
            console.log("Complyze: Initializing FloatingUI...");
            window.complyzeFloatingUI = new ComplyzeFloatingUI();
            console.log("Complyze: FloatingUI initialized successfully");
        } else {
            console.log("Complyze: FloatingUI already exists");
        }
    } catch (error) {
        console.error("Complyze: Failed to initialize FloatingUI:", error);
        // Retry after a delay
        setTimeout(() => {
            try {
                if (!window.complyzeFloatingUI) {
                    window.complyzeFloatingUI = new ComplyzeFloatingUI();
                    console.log("Complyze: FloatingUI initialized on retry");
                }
            } catch (retryError) {
                console.error("Complyze: Failed to initialize FloatingUI on retry:", retryError);
            }
        }, 2000);
    }
};

// Try multiple initialization strategies
setTimeout(initializeFloatingUI, 500);  // Quick initialization
setTimeout(initializeFloatingUI, 1000); // Delayed initialization
setTimeout(initializeFloatingUI, 2000); // Fallback initialization

// Also try immediate initialization for supported platforms
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initializeFloatingUI();
}

// Listen for DOM ready events
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFloatingUI);
}

console.log("Complyze: Floating UI script loaded and initialization scheduled"); 