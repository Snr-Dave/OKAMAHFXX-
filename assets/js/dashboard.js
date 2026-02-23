// Dashboard JavaScript functionality with improved authentication
import { auth, investments, subscriptions } from './supabase.js'

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication first and wait for it
    checkAuthentication().then(isAuth => {
        if (!isAuth) {
            // Auth check failed, don't initialize dashboard
            return
        }

        // Initialize dashboard components only after auth passes
        initializeSidebar()
        initializeCharts()
        initializeNotifications()
        initializeUserMenu()
        initializeQuickActions()
        
        // Load dashboard data
        loadDashboardData()

        // Set up real-time subscriptions
        setupRealtimeSubscriptions()
    })

    async function checkAuthentication() {
        try {
            console.log('[v0] Checking authentication...')
            
            // Add a small delay to allow localStorage to be read
            await new Promise(resolve => setTimeout(resolve, 300))
            
            const isAuthenticated = await auth.isAuthenticated()
            console.log('[v0] Authentication result:', isAuthenticated)
            
            if (!isAuthenticated) {
                console.log('[v0] User not authenticated, redirecting to login...')
                showNotification('Please log in to access the dashboard', 'error')
                
                // Wait a bit longer before redirecting so user sees the message
                setTimeout(() => {
                    window.location.href = 'login.html'
                }, 1500)
                return false
            }

            // Get user data and update UI
            const { user } = await auth.getUser()
            console.log('[v0] User data retrieved:', user?.email)
            
            if (user) {
                updateUserInfo(user)
            }
            
            return true
        } catch (error) {
            console.error('[v0] Authentication error:', error)
            showNotification('Authentication error. Please log in again.', 'error')
            setTimeout(() => {
                window.location.href = 'login.html'
            }, 1500)
            return false
        }
    }

    function updateUserInfo(user) {
        const userName = document.querySelector('.user-name')
        const userRole = document.querySelector('.user-role')

        // Get user data from local storage or user metadata
        const localSession = localStorage.getItem('userSession')
        let firstName = ''
        let lastName = ''

        if (localSession) {
            const sessionData = JSON.parse(localSession)
            firstName = sessionData.firstName || user.user_metadata?.first_name || ''
            lastName = sessionData.lastName || user.user_metadata?.last_name || ''
        }

        if (userName) {
            const fullName = `${firstName} ${lastName}`.trim()
            userName.textContent = fullName || user.email.split('@')[0]
        }

        if (userRole) {
            userRole.textContent = user.email_confirmed_at ? 'Verified Investor' : 'Premium Investor'
        }
    }

    async function loadDashboardData() {
        try {
            // Show loading state
            showLoadingState(true)

            // Load user investments
            const { data: userInvestments, error } = await investments.getUserInvestments()
            
            if (error) {
                throw new Error(error.message)
            }

            // Calculate portfolio stats
            const portfolioStats = calculatePortfolioStats(userInvestments || [])
            
            // Update dashboard
            updateDashboardStats(portfolioStats)
            updateInvestmentsTable(userInvestments || [])
            updateChartData(userInvestments || [])
            
            // Hide loading state
            showLoadingState(false)
            
        } catch (error) {
            console.error('Error loading dashboard data:', error)
            showNotification('Failed to load dashboard data', 'error')
            showLoadingState(false)
        }
    }

    function showLoadingState(show) {
        const loadingElements = document.querySelectorAll('.stat-card h3, .investments-table tbody')
        loadingElements.forEach(element => {
            if (show) {
                element.style.opacity = '0.5'
                element.style.pointerEvents = 'none'
            } else {
                element.style.opacity = '1'
                element.style.pointerEvents = 'auto'
            }
        })
    }

    function calculatePortfolioStats(investmentData) {
        const stats = {
            totalValue: 0,
            totalReturns: 0,
            availableBalance: 8500, // This would come from user's wallet/account
            activeInvestments: 0,
            portfolioGrowth: 0,
            returnsGrowth: 0
        }

        investmentData.forEach(investment => {
            if (investment.status === 'active' || investment.status === 'matured') {
                stats.totalValue += parseFloat(investment.amount)
                stats.activeInvestments++
                
                // Calculate returns based on time elapsed and expected return
                const monthsElapsed = Math.min(
                    investment.term_months,
                    Math.floor((new Date() - new Date(investment.created_at)) / (1000 * 60 * 60 * 24 * 30))
                )
                
                const monthlyRate = parseFloat(investment.expected_return) / 100 / 12
                const currentValue = parseFloat(investment.amount) * Math.pow(1 + monthlyRate, monthsElapsed)
                stats.totalReturns += currentValue - parseFloat(investment.amount)
            }
        })

        // Calculate growth percentages (mock data for demo)
        stats.portfolioGrowth = stats.totalValue > 0 ? 12.5 : 0
        stats.returnsGrowth = stats.totalReturns > 0 ? 8.3 : 0

        return stats
    }

    function updateDashboardStats(portfolio) {
        // Update stat cards
        const statCards = document.querySelectorAll('.stat-card')
        
        if (statCards[0]) {
            const totalValue = statCards[0].querySelector('h3')
            const totalChange = statCards[0].querySelector('.stat-change')
            if (totalValue) totalValue.textContent = formatCurrency(portfolio.totalValue)
            if (totalChange) totalChange.textContent = `+${portfolio.portfolioGrowth}%`
        }

        if (statCards[1]) {
            const totalReturns = statCards[1].querySelector('h3')
            const returnsChange = statCards[1].querySelector('.stat-change')
            if (totalReturns) totalReturns.textContent = formatCurrency(portfolio.totalReturns)
            if (returnsChange) returnsChange.textContent = `+${portfolio.returnsGrowth}%`
        }

        if (statCards[2]) {
            const availableBalance = statCards[2].querySelector('h3')
            if (availableBalance) availableBalance.textContent = formatCurrency(portfolio.availableBalance)
        }

        if (statCards[3]) {
            const activeInvestments = statCards[3].querySelector('h3')
            if (activeInvestments) activeInvestments.textContent = portfolio.activeInvestments.toString()
        }
    }

    function formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount)
    }

    function updateInvestmentsTable(investmentData) {
        const tableBody = document.querySelector('.investments-table tbody')
        if (!tableBody) return

        tableBody.innerHTML = ''

        if (investmentData.length === 0) {
            const row = document.createElement('tr')
            row.innerHTML = `
                <td colspan="7" style="text-align: center; padding: 2rem; color: #6B7280;">
                    No investments found. <a href="invest.html" style="color: #4F46E5;">Make your first investment</a>
                </td>
            `
            tableBody.appendChild(row)
            return
        }

        investmentData.forEach(investment => {
            const row = document.createElement('tr')
            const iconClass = getInvestmentIcon(investment.investment_type)
            const badgeClass = investment.investment_type.replace('_', '-')
            
            row.innerHTML = `
                <td>
                    <div class="investment-info">
                        <i class="fas ${iconClass}"></i>
                        <span>${investment.investment_name}</span>
                    </div>
                </td>
                <td><span class="badge ${badgeClass}">${investment.investment_type.replace('-', ' ')}</span></td>
                <td>${formatCurrency(investment.amount)}</td>
                <td class="positive">+${investment.expected_return}%</td>
                <td><span class="status ${investment.status}">${investment.status}</span></td>
                <td>${formatDate(investment.maturity_date)}</td>
                <td>
                    <button class="action-btn" onclick="viewInvestment('${investment.id}')">
                        <i class="fas ${investment.status === 'matured' ? 'fa-download' : 'fa-eye'}"></i>
                    </button>
                </td>
            `
            tableBody.appendChild(row)
        })
    }

    function getInvestmentIcon(type) {
        switch (type) {
            case 'short-term': return 'fa-rocket'
            case 'long-term': return 'fa-tree'
            case 'secure-income': return 'fa-shield-alt'
            default: return 'fa-chart-line'
        }
    }

    function formatDate(dateString) {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    function updateChartData(investmentData) {
        // Generate portfolio performance data
        const portfolioData = generatePortfolioChartData(investmentData)
        const allocationData = generateAllocationChartData(investmentData)

        // Update charts if they exist
        updatePortfolioChart(portfolioData)
        updateAllocationChart(allocationData)
    }

    function generatePortfolioChartData(investmentData) {
        // Generate mock historical data based on investments
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
        const data = []
        
        let baseValue = 0
        investmentData.forEach(inv => {
            if (inv.status === 'active' || inv.status === 'matured') {
                baseValue += parseFloat(inv.amount)
            }
        })

        // Generate growth curve
        for (let i = 0; i < months.length; i++) {
            const growth = (i + 1) * 0.02 // 2% growth per month
            data.push(Math.round(baseValue * (1 + growth)))
        }

        return { labels: months, data }
    }

    function generateAllocationChartData(investmentData) {
        const allocation = { 'short-term': 0, 'long-term': 0, 'secure-income': 0 }
        let total = 0

        investmentData.forEach(inv => {
            if (inv.status === 'active') {
                const amount = parseFloat(inv.amount)
                allocation[inv.investment_type] += amount
                total += amount
            }
        })

        // Convert to percentages
        const percentages = {
            'short-term': total > 0 ? Math.round((allocation['short-term'] / total) * 100) : 0,
            'long-term': total > 0 ? Math.round((allocation['long-term'] / total) * 100) : 0,
            'secure-income': total > 0 ? Math.round((allocation['secure-income'] / total) * 100) : 0
        }

        // Ensure percentages add up to 100
        const sum = percentages['short-term'] + percentages['long-term'] + percentages['secure-income']
        if (sum === 0) {
            // Default allocation if no investments
            return {
                labels: ['Short-term', 'Long-term', 'Cash'],
                data: [45, 35, 20],
                colors: ['#4F46E5', '#10B981', '#F59E0B']
            }
        }

        const cash = Math.max(0, 100 - sum)
        
        return {
            labels: ['Short-term', 'Long-term', 'Cash'],
            data: [percentages['short-term'], percentages['long-term'], cash],
            colors: ['#4F46E5', '#10B981', '#F59E0B']
        }
    }

    function setupRealtimeSubscriptions() {
        // Subscribe to investment changes
        const investmentSubscription = subscriptions.subscribeToInvestments((payload) => {
            console.log('Investment update:', payload)
            loadDashboardData() // Reload data when investments change
        })

        // Subscribe to payment changes
        const paymentSubscription = subscriptions.subscribeToPayments((payload) => {
            console.log('Payment update:', payload)
            if (payload.eventType === 'UPDATE' && payload.new.status === 'succeeded') {
                showNotification('Payment confirmed! Your investment is now active.', 'success')
                loadDashboardData()
            }
        })

        // Cleanup subscriptions when page unloads
        window.addEventListener('beforeunload', () => {
            investmentSubscription.unsubscribe()
            paymentSubscription.unsubscribe()
        })
    }

    function initializeSidebar() {
        const sidebarToggle = document.querySelector('.sidebar-toggle')
        const sidebar = document.querySelector('.sidebar')
        const mainContent = document.querySelector('.main-content')

        if (sidebarToggle && sidebar) {
            sidebarToggle.addEventListener('click', function() {
                sidebar.classList.toggle('active')
                if (mainContent) {
                    mainContent.classList.toggle('sidebar-open')
                }
            })
        }

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', function(e) {
            if (window.innerWidth <= 768) {
                if (sidebar && !sidebar.contains(e.target) && sidebarToggle && !sidebarToggle.contains(e.target)) {
                    sidebar.classList.remove('active')
                    if (mainContent) {
                        mainContent.classList.remove('sidebar-open')
                    }
                }
            }
        })

        // Handle sidebar navigation
        const navLinks = document.querySelectorAll('.sidebar-nav a')
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault()
                
                // Remove active class from all links
                navLinks.forEach(l => l.parentElement.classList.remove('active'))
                
                // Add active class to clicked link
                this.parentElement.classList.add('active')
                
                // Handle navigation
                const section = this.getAttribute('href').substring(1)
                handleNavigation(section)
            })
        })
    }

    function handleNavigation(section) {
        console.log(`Navigating to: ${section}`)
        
        switch(section) {
            case 'overview':
                showNotification('Overview section is already active', 'info')
                break
            case 'portfolio':
                showNotification('Portfolio view coming soon', 'info')
                break
            case 'investments':
                window.location.href = 'invest.html'
                break
            case 'transactions':
                showNotification('Transactions view coming soon', 'info')
                break
            case 'certificates':
                window.location.href = 'certificate.html'
                break
            case 'settings':
                showNotification('Settings view coming soon', 'info')
                break
        }
    }

    function initializeCharts() {
        // Portfolio Performance Chart
        const portfolioCtx = document.getElementById('portfolioChart')
        if (portfolioCtx && typeof Chart !== 'undefined') {
            window.portfolioChart = new Chart(portfolioCtx, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Portfolio Value',
                        data: [0, 0, 0, 0, 0, 0],
                        borderColor: '#4F46E5',
                        backgroundColor: 'rgba(79, 70, 229, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#4F46E5',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 6,
                        pointHoverRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                display: false
                            },
                            border: {
                                display: false
                            }
                        },
                        y: {
                            grid: {
                                color: 'rgba(0, 0, 0, 0.05)'
                            },
                            border: {
                                display: false
                            },
                            ticks: {
                                callback: function(value) {
                                    return '$' + (value / 1000) + 'K'
                                }
                            }
                        }
                    },
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    }
                }
            })
        }

        // Asset Allocation Chart
        const allocationCtx = document.getElementById('allocationChart')
        if (allocationCtx && typeof Chart !== 'undefined') {
            window.allocationChart = new Chart(allocationCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Short-term', 'Long-term', 'Cash'],
                    datasets: [{
                        data: [45, 35, 20],
                        backgroundColor: ['#4F46E5', '#10B981', '#F59E0B'],
                        borderWidth: 0,
                        cutout: '70%'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            })
        }

        // Chart controls
        const chartBtns = document.querySelectorAll('.chart-btn')
        chartBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                // Remove active class from all buttons
                chartBtns.forEach(b => b.classList.remove('active'))
                
                // Add active class to clicked button
                this.classList.add('active')
                
                // Update chart data based on selected period
                const period = this.textContent
                updateChartPeriod(period)
            })
        })
    }

    function updatePortfolioChart(data) {
        if (window.portfolioChart) {
            window.portfolioChart.data.labels = data.labels
            window.portfolioChart.data.datasets[0].data = data.data
            window.portfolioChart.update()
        }
    }

    function updateAllocationChart(data) {
        if (window.allocationChart) {
            window.allocationChart.data.labels = data.labels
            window.allocationChart.data.datasets[0].data = data.data
            window.allocationChart.data.datasets[0].backgroundColor = data.colors
            window.allocationChart.update()
        }
    }

    function updateChartPeriod(period) {
        console.log(`Updating chart data for period: ${period}`)
        showNotification(`Chart updated for ${period} period`, 'success')
    }

    function initializeNotifications() {
        const notificationBtn = document.querySelector('.notification-btn')
        if (notificationBtn) {
            notificationBtn.addEventListener('click', function() {
                showNotificationPanel()
            })
        }
    }

    function showNotificationPanel() {
        // Create notification panel
        const panel = document.createElement('div')
        panel.className = 'notification-panel'
        panel.innerHTML = `
            <div class="notification-panel-header">
                <h3>Notifications</h3>
                <button class="close-panel">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="notification-panel-content">
                <div class="notification-item">
                    <div class="notification-icon">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <div class="notification-content">
                        <h4>Welcome to Okeamah Investment</h4>
                        <p>Your account is ready. Start investing to build your wealth.</p>
                        <span class="notification-time">Just now</span>
                    </div>
                </div>
                <div class="notification-item">
                    <div class="notification-icon">
                        <i class="fas fa-bell"></i>
                    </div>
                    <div class="notification-content">
                        <h4>New Investment Opportunity</h4>
                        <p>High-yield investment opportunities are now available.</p>
                        <span class="notification-time">1 hour ago</span>
                    </div>
                </div>
            </div>
        `

        document.body.appendChild(panel)

        // Show panel
        setTimeout(() => {
            panel.classList.add('show')
        }, 100)

        // Close panel functionality
        const closeBtn = panel.querySelector('.close-panel')
        closeBtn.addEventListener('click', () => {
            panel.classList.remove('show')
            setTimeout(() => {
                document.body.removeChild(panel)
            }, 300)
        })

        // Close when clicking outside
        panel.addEventListener('click', (e) => {
            if (e.target === panel) {
                closeBtn.click()
            }
        })
    }

    function initializeUserMenu() {
        const userMenu = document.querySelector('.user-menu')
        if (userMenu) {
            userMenu.addEventListener('click', function() {
                showUserDropdown()
            })
        }
    }

    function showUserDropdown() {
        // Create dropdown menu
        const dropdown = document.createElement('div')
        dropdown.className = 'user-dropdown-menu'
        dropdown.innerHTML = `
            <div class="dropdown-item">
                <i class="fas fa-user"></i>
                <span>Profile</span>
            </div>
            <div class="dropdown-item">
                <i class="fas fa-cog"></i>
                <span>Settings</span>
            </div>
            <div class="dropdown-item">
                <i class="fas fa-question-circle"></i>
                <span>Help & Support</span>
            </div>
            <div class="dropdown-divider"></div>
            <div class="dropdown-item logout">
                <i class="fas fa-sign-out-alt"></i>
                <span>Logout</span>
            </div>
        `

        // Position dropdown
        const userMenu = document.querySelector('.user-menu')
        const rect = userMenu.getBoundingClientRect()
        dropdown.style.position = 'fixed'
        dropdown.style.top = `${rect.bottom + 10}px`
        dropdown.style.right = '20px'

        document.body.appendChild(dropdown)

        // Show dropdown
        setTimeout(() => {
            dropdown.classList.add('show')
        }, 100)

        // Handle dropdown clicks
        const dropdownItems = dropdown.querySelectorAll('.dropdown-item')
        dropdownItems.forEach(item => {
            item.addEventListener('click', function() {
                const text = this.querySelector('span').textContent
                
                if (text === 'Logout') {
                    handleLogout()
                } else {
                    showNotification(`${text} feature coming soon`, 'info')
                }
                
                // Close dropdown
                dropdown.classList.remove('show')
                setTimeout(() => {
                    document.body.removeChild(dropdown)
                }, 300)
            })
        })

        // Close dropdown when clicking outside
        setTimeout(() => {
            document.addEventListener('click', function closeDropdown(e) {
                if (!dropdown.contains(e.target) && !userMenu.contains(e.target)) {
                    dropdown.classList.remove('show')
                    setTimeout(() => {
                        if (document.body.contains(dropdown)) {
                            document.body.removeChild(dropdown)
                        }
                    }, 300)
                    document.removeEventListener('click', closeDropdown)
                }
            })
        }, 100)
    }

    async function handleLogout() {
        try {
            console.log('[v0] Starting logout process...')
            
            const { error } = await auth.signOut()
            
            if (error) {
                throw new Error(error.message)
            }

            // Ensure localStorage is cleared
            localStorage.removeItem('userSession')
            localStorage.removeItem('rememberUser')
            console.log('[v0] User session cleared from localStorage')

            // Show logout message
            showNotification('Logged out successfully', 'success')
            
            // Redirect to login page
            setTimeout(() => {
                console.log('[v0] Redirecting to login page...')
                window.location.href = 'login.html'
            }, 1500)
        } catch (error) {
            console.error('[v0] Logout error:', error)
            showNotification('Error logging out', 'error')
        }
    }

    function initializeQuickActions() {
        const actionCards = document.querySelectorAll('.action-card')
        actionCards.forEach(card => {
            card.addEventListener('click', function() {
                const actionText = this.querySelector('span').textContent
                handleQuickAction(actionText)
            })
        })

        // New Investment button
        const newInvestmentBtn = document.querySelector('.section-header .btn-primary')
        if (newInvestmentBtn) {
            newInvestmentBtn.addEventListener('click', function() {
                window.location.href = 'invest.html'
            })
        }
    }

    function handleQuickAction(action) {
        switch(action) {
            case 'New Investment':
                window.location.href = 'invest.html'
                break
            case 'Withdraw Funds':
                showNotification('Withdrawal process coming soon', 'info')
                break
            case 'Download Report':
                showNotification('Generating report...', 'info')
                setTimeout(() => {
                    showNotification('Report downloaded successfully', 'success')
                }, 2000)
                break
            case 'Contact Support':
                showNotification('Support chat coming soon', 'info')
                break
            default:
                showNotification(`${action} feature coming soon`, 'info')
        }
    }

    // Global function for investment actions
    window.viewInvestment = function(investmentId) {
        showNotification('Viewing investment details...', 'info')
        setTimeout(() => {
            window.location.href = `certificate.html?investment=${investmentId}`
        }, 1000)
    }

    function showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div')
        notification.className = `notification notification-${type}`
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `

        // Add to page
        document.body.appendChild(notification)

        // Show notification
        setTimeout(() => {
            notification.classList.add('show')
        }, 100)

        // Auto remove after 5 seconds
        setTimeout(() => {
            removeNotification(notification)
        }, 5000)

        // Close button functionality
        const closeBtn = notification.querySelector('.notification-close')
        closeBtn.addEventListener('click', () => {
            removeNotification(notification)
        })
    }

    function removeNotification(notification) {
        notification.classList.remove('show')
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification)
            }
        }, 300)
    }

    // Add dynamic styles for notifications and dropdowns
    const dynamicStyles = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            border-radius: 0.5rem;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            border-left: 4px solid var(--primary-color);
            padding: 1rem;
            display: flex;
            align-items: center;
            gap: 1rem;
            max-width: 400px;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            z-index: 10000;
        }
        
        .notification.show {
            transform: translateX(0);
        }
        
        .notification-success {
            border-left-color: var(--secondary-color);
        }
        
        .notification-error {
            border-left-color: #EF4444;
        }
        
        .notification-info {
            border-left-color: #3B82F6;
        }
        
        .notification-content {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            flex: 1;
        }
        
        .notification-content i {
            color: var(--primary-color);
        }
        
        .notification-success .notification-content i {
            color: var(--secondary-color);
        }
        
        .notification-error .notification-content i {
            color: #EF4444;
        }
        
        .notification-info .notification-content i {
            color: #3B82F6;
        }
        
        .notification-close {
            background: none;
            border: none;
            color: var(--text-light);
            cursor: pointer;
            padding: 0.25rem;
            border-radius: 0.25rem;
            transition: all 0.3s ease;
        }
        
        .notification-close:hover {
            background: var(--bg-secondary);
            color: var(--text-primary);
        }
        
        .notification-panel {
            position: fixed;
            top: 0;
            right: -400px;
            width: 400px;
            height: 100vh;
            background: white;
            box-shadow: -5px 0 15px rgba(0, 0, 0, 0.1);
            transition: right 0.3s ease;
            z-index: 10000;
            overflow-y: auto;
        }
        
        .notification-panel.show {
            right: 0;
        }
        
        .notification-panel-header {
            padding: 1.5rem;
            border-bottom: 1px solid var(--border-color);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .notification-panel-header h3 {
            margin: 0;
            color: var(--text-primary);
        }
        
        .close-panel {
            background: none;
            border: none;
            color: var(--text-light);
            cursor: pointer;
            padding: 0.5rem;
            border-radius: 0.25rem;
            transition: all 0.3s ease;
        }
        
        .close-panel:hover {
            background: var(--bg-secondary);
            color: var(--text-primary);
        }
        
        .notification-panel-content {
            padding: 1rem;
        }
        
        .notification-item {
            display: flex;
            gap: 1rem;
            padding: 1rem;
            border-radius: 0.5rem;
            margin-bottom: 1rem;
            transition: background 0.3s ease;
        }
        
        .notification-item:hover {
            background: var(--bg-secondary);
        }
        
        .notification-item .notification-icon {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: var(--primary-color);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            flex-shrink: 0;
        }
        
        .notification-item .notification-content h4 {
            margin: 0 0 0.25rem 0;
            color: var(--text-primary);
            font-size: 0.875rem;
        }
        
        .notification-item .notification-content p {
            margin: 0 0 0.5rem 0;
            color: var(--text-secondary);
            font-size: 0.75rem;
            line-height: 1.4;
        }
        
        .notification-time {
            font-size: 0.625rem;
            color: var(--text-light);
        }
        
        .user-dropdown-menu {
            position: fixed;
            background: white;
            border-radius: 0.5rem;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            border: 1px solid var(--border-color);
            min-width: 200px;
            opacity: 0;
            transform: translateY(-10px);
            transition: all 0.3s ease;
            z-index: 10000;
        }
        
        .user-dropdown-menu.show {
            opacity: 1;
            transform: translateY(0);
        }
        
        .dropdown-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem 1rem;
            cursor: pointer;
            transition: background 0.3s ease;
            color: var(--text-primary);
            font-size: 0.875rem;
        }
        
        .dropdown-item:hover {
            background: var(--bg-secondary);
        }
        
        .dropdown-item.logout {
            color: #EF4444;
        }
        
        .dropdown-item.logout:hover {
            background: rgba(239, 68, 68, 0.1);
        }
        
        .dropdown-divider {
            height: 1px;
            background: var(--border-color);
            margin: 0.5rem 0;
        }
        
        @media (max-width: 768px) {
            .notification-panel {
                width: 100%;
                right: -100%;
            }
            
            .notification {
                left: 20px;
                right: 20px;
                max-width: none;
                transform: translateY(-100%);
            }
            
            .notification.show {
                transform: translateY(0);
            }
        }
    `

    // Inject dynamic styles
    const styleSheet = document.createElement('style')
    styleSheet.textContent = dynamicStyles
    document.head.appendChild(styleSheet)

    // Check for URL parameters (e.g., successful payment)
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('payment') === 'success') {
        showNotification('Payment successful! Your investment is now active.', 'success')
    }
    if (urlParams.get('investment')) {
        const investmentId = urlParams.get('investment')
        const certificateNumber = urlParams.get('certificate')
        showNotification(`Investment ${certificateNumber} created successfully!`, 'success')
    }

    // Auto-refresh dashboard data every 30 seconds
    setInterval(() => {
        loadDashboardData()
    }, 30000)
})
