
function ReviewControls() {
    const [feedback, setFeedback] = useState("");

    return (
        <>
            <div className="mb-4">
                <label className="text-sm font-medium mb-1 block">Twoje uwagi (wymagane przy odrzuceniu):</label>
                <Textarea
                    name="feedback"
                    placeholder="Wpisz komentarz..."
                    className="bg-white"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                />
            </div>
            <div className="flex gap-4">
                <Button type="submit" name="decision" value="accepted" className="bg-green-600 hover:bg-green-700 text-white min-w-[200px]">
                    Zatwierdź realizację
                </Button>
                <Button
                    type="submit"
                    name="decision"
                    value="rejected"
                    variant="outline"
                    disabled={!feedback.trim()}
                    title={!feedback.trim() ? "Wpisz uwagi, aby zgłosić poprawki" : ""}
                    className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Zgłoś do poprawy
                </Button>
            </div>
        </>
    );
}
