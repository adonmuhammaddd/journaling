export default function ApplicationLogo(props) {
    return (
        <svg {...props} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect x="6" y="9" width="36" height="33" rx="7" />
            <rect x="13" y="4" width="4" height="10" rx="2" />
            <rect x="31" y="4" width="4" height="10" rx="2" />
            <path d="M14 23h20M14 30h14M14 37h8" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
        </svg>
    );
}
