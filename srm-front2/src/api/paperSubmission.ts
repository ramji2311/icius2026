export const submitPaper = async (formData: FormData) => {
  try {
    
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const response = await fetch(`${apiUrl}/submit-paper`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to submit paper');
    }

    return await response.json();
  } catch (error) {
    console.error('Error submitting paper:', error);
    throw error;
  }
};