import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const TabGuard = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const instanceId = useRef(Math.random().toString(36).substring(2, 9));

    useEffect(() => {
        const channel = new BroadcastChannel("mcq_tab_sync");

        const isAssessmentPage =
            location.pathname === "/assessment" ||
            location.pathname === "/coding-assessment" ||
            location.pathname === "/instructions";

        // 1. When this tab starts/mounts, it checks competition
        if (isAssessmentPage) {
            // Force all non-assessment tabs to close/redirect
            channel.postMessage({
                type: "FORCE_CLEANUP",
                id: instanceId.current,
                timestamp: Date.now()
            });

            // Special check to prevent multiple assessment tabs:
            // We broadcast a "Ping" to see if another assessment is already running
            channel.postMessage({ type: "CHECK_CONFLICT", id: instanceId.current });
        }

        channel.onmessage = (event) => {
            const { type, id } = event.data;

            // Rule A: If someone started an assessment, and I am NOT an assessment, leave.
            if (type === "FORCE_CLEANUP" && !isAssessmentPage) {
                toast.error("Assessment active in another tab. This tab has been synchronized.", { id: "tab-sync-toast" });
                navigate("/");
                // Suggest closing the tab if it's no longer needed
                try { window.close(); } catch (e) { }
            }

            // Rule B: If I am an assessment tab, and I hear a "CHECK_CONFLICT" from a NEWER tab
            if (type === "CHECK_CONFLICT" && isAssessmentPage && id !== instanceId.current) {
                // I register my presence to the intruder
                channel.postMessage({ type: "CONFLICT_ALERT", targetId: id });
            }

            // Rule C: If I am receiving a "CONFLICT_ALERT" specifically targeted at me
            if (type === "CONFLICT_ALERT" && event.data.targetId === instanceId.current) {
                toast.error("An assessment tab is already open. For security, only one instance is allowed.", { duration: 6000 });
                navigate("/candidate-dashboard");
                try { window.close(); } catch (e) { }
            }
        };

        return () => {
            channel.close();
        };
    }, [location.pathname, navigate]);

    return null;
};

export default TabGuard;
