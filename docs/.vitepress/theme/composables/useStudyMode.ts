import { ref } from "vue";

/**
 * Study mode.
 *
 * A reader who is testing themselves hides the code and the hint ladders, and
 * widens the text. The choice is remembered per browser and applied by a class
 * on the root element, so the stylesheet can do the hiding without any page
 * needing to know about it.
 */

const STORAGE_KEY = "aayntn-study-mode";
const study = ref(false);
let ready = false;
let clearedForPrint = false;

function apply(): void {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("aayntn-study", study.value);
}

/**
 * Study mode is a screen affordance. A printed reference that omits the code
 * is not a reference, so the class is removed for the duration of the print
 * job and restored afterwards.
 */
function clearForPrint(): void {
    if (typeof document === "undefined" || !study.value) return;
    clearedForPrint = true;
    document.documentElement.classList.remove("aayntn-study");
}

function restoreAfterPrint(): void {
    if (!clearedForPrint) return;
    clearedForPrint = false;
    apply();
}

export function useStudyMode() {
    if (!ready && typeof window !== "undefined") {
        ready = true;
        study.value = window.localStorage.getItem(STORAGE_KEY) === "1";
        apply();
        window.addEventListener("beforeprint", clearForPrint);
        window.addEventListener("afterprint", restoreAfterPrint);
    }

    function toggle(): void {
        study.value = !study.value;
        if (typeof window !== "undefined") {
            window.localStorage.setItem(STORAGE_KEY, study.value ? "1" : "0");
        }
        apply();
    }

    return { study, toggle };
}
