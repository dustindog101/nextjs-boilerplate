# Feature Brief: White-Label Reseller Program

## 1. Executive Summary
The goal of this feature is to provide verified resellers with their own **unbranded, white-label order pages**. Resellers will receive a custom subdomain (e.g., `manny.idpirate.com`), where their end-customers can seamlessly place orders without ever seeing the "ID Pirate" name or branding. 

All orders placed through these subdomains will automatically be credited to the specific reseller's account. To manage these orders, resellers will receive access to a dedicated dashboard (similar to the admin panel) where they can view and track their customer's orders natively.

---

## 2. Core User Flows

### A. The End-Customer Flow
1. **Access:** Customer clicks the reseller's link (e.g., `manny.idpirate.com`).
2. **Experience:** The customer sees a generic "Secure Checkout Portal" with absolutely no ID Pirate headers, footers, or logos.
3. **Checkout:** They fill out a streamlined, 1-page checkout form. They can add as many IDs as they want to the order (for themselves or friends) by repeatedly entering details and uploading photos, before finally entering shipping info.
4. **Completion:** The order is submitted seamlessly. The customer does not need to create an ID Pirate account.

### B. The Reseller Flow
1. **Onboarding:** The user officially becomes a registered reseller (specific onboarding channels/processes are TBD). They will then be able to view their custom assigned subdomain link.
2. **Dashboard:** The reseller logs into `idpirate.com` normally, but has access to a secure `/reseller` dashboard route.
3. **Overview:** The dashboard clearly displays their custom reseller link so they can easily copy and share it. It also features metrics and a revenue chart similar to the main Admin dashboard.
4. **Order Management:** Inside this dashboard, they see an admin-style table listing **only** the orders that were placed through their specific subdomain. 
5. **Edit Controls:** *Essential feature:* Resellers have the ability to update and edit their orders, including changing order statuses (e.g., to "Shipped") and tracking whether they are "Paid".

### C. The Admin Flow
1. **Management:** Admin visits the existing `/admin` panel and clicks on the Resellers tab.
2. **Distribution & Grid Visibility:** Next to each reseller's name in the grid, there will be visual pill labels showing how many orders that reseller has (e.g., total orders, breakdown by active status). 
3. **Link Modification:** The Admin can view, copy, and physically modify the custom link assigned to the reseller.
4. **Attribution Visibility:** Admins can view all orders globally as usual. *Developer Note:* We should explicitly mark which orders are reseller-generated in the backend rather than just implicitly hiding them. See section 3 for notes.

---

## 3. Technical Implementation Notes (For the Developer)

*Note to Dev: This section outlines the initial proposed strategy. If you see better, more scalable patterns for the Next.js/Lambda stack, please feel free to iterate on these concepts.*

### Frontend Routing & Subdomains
- **Proposed: Next.js Middleware (`middleware.ts`)**: The initial thought is to implement middleware that intercepts incoming requests. If the hostname is a subdomain (e.g., `[username].idpirate.com`), the middleware silently rewrites the URL to an internal route (`/r/[username]`). 
- **Developer Question:** *Is there a better way to handle these dynamic white-label subdomains in our specific Vercel/Next.js environment? Please consider edge cases with SSL wildcard generation and evaluating if traditional path-based routes (`/r/[username]`) might be vastly simpler to maintain long-term than subdomains.*
- **Branding Removal**: The global `UniversalHeader` and `Footer` components will be updated to return `null` if the route matches the white-label pattern (`/r/*`).

### Data Attribution (Lambda / Database)
- **Current Idea:** The existing backend Lambda architecture relies on `userId`. If the unbranded frontend injects the reseller's `userId` into the payload, the backend will accept it.
- **Developer Question:** *We likely need a more explicit marker in the database to distinguish "reseller orders" from "normal orders", rather than just assuming any order belonging to a reseller's `userId` is an unbranded order. Should we update the Lambda schema to accept a new top-level `resellerId` or `origin: "white_label"` flag to future-proof analytics and logic?*

### Dedicated Route Protection & Permissions
- Need a new Higher-Order Component (`withResellerAuth.tsx`) to protect the `/reseller` dashboard route.
- **Lambda Permission Updates:** Currently, only `admin` roles can use the order update endpoints. The Lambda validating the route will need to be updated to allow users with `isReseller: true` to update an order **only if** they are explicitly the owner or assigned reseller of that order.
