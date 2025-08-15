export default function LayoutBody(props) {
    return (
        <>
            <main className="l-main" data-theme="0">
                {props.children}
            </main>
        </>
    );
}