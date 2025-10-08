const splitTextIntoChunks = (text, limit) => {
    // If the text is already within the limit, return it as a single chunk
    if (text.length <= limit) {
        return [text]
    }

    const chunks = []
    let currentChunk = ""

    // Split the text by one or more newline characters to get paragraphs
    const paragraphs = text.split(/\n+/)

    for (const paragraph of paragraphs) {
        // A regex to split a paragraph into sentences. It handles various sentence endings.
        const sentences = paragraph.match(/[^.!?]+[.!?]+|.+/g) || []

        for (const sentence of sentences) {
            const trimmedSentence = sentence.trim()
            if (trimmedSentence.length === 0) continue

            // Check if adding the new sentence would exceed the limit
            if ((currentChunk + " " + trimmedSentence).length > limit) {
                // If the current chunk has content, push it to the array
                if (currentChunk.length > 0) {
                    chunks.push(currentChunk)
                }

                // If the sentence itself is larger than the limit, it must be split
                if (trimmedSentence.length > limit) {
                    for (let i = 0; i < trimmedSentence.length; i += limit) {
                        chunks.push(trimmedSentence.substring(i, i + limit))
                    }
                    currentChunk = "" // Reset chunk as the oversized sentence is now handled
                } else {
                    // Otherwise, start a new chunk with the current sentence
                    currentChunk = trimmedSentence
                }
            } else {
                // If it fits, add the sentence to the current chunk
                currentChunk = currentChunk.length === 0 ? trimmedSentence : currentChunk + " " + trimmedSentence
            }
        }

        // After processing a paragraph's sentences, add a newline if the chunk isn't empty
        if (currentChunk.length > 0) {
            currentChunk += "\n"
        }
    }

    // Add the last remaining chunk if it exists
    if (currentChunk.trim().length > 0) {
        chunks.push(currentChunk.trim())
    }

    return chunks
}

export default splitTextIntoChunks
