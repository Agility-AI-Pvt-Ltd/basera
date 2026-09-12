import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import { buildPetMediaPath, removePetMedia, uploadPetFile } from '@/lib/petStorage';
import {
  rowToPetDocument,
  type PetDocument,
  type PetDocumentRow,
  type PetDocumentType,
} from '@/types/pet';

type UploadDocumentInput = {
  petId: string;
  ownerId: string;
  docType: PetDocumentType;
  fileUri: string;
  mimeType: string;
  fileName: string;
  issuedDate?: string | null;
  expiryDate?: string | null;
};

export function usePetDocuments(petId: string | undefined) {
  const [documents, setDocuments] = useState<PetDocument[]>([]);
  const [isReady, setIsReady] = useState(false);

  const loadDocuments = useCallback(async () => {
    if (!petId) return;
    const { data, error } = await supabase
      .from('pet_documents')
      .select('*')
      .eq('pet_id', petId)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    setDocuments((data as PetDocumentRow[]).map(rowToPetDocument));
  }, [petId]);

  useEffect(() => {
    if (!petId) {
      setIsReady(true);
      return;
    }
    setIsReady(false);
    loadDocuments()
      .catch(() => setDocuments([]))
      .finally(() => setIsReady(true));
  }, [petId, loadDocuments]);

  const uploadDocument = useCallback(
    async (input: UploadDocumentInput) => {
      const storageKey = buildPetMediaPath(input.ownerId, input.petId, input.fileName);
      await uploadPetFile(storageKey, input.fileUri, input.mimeType);

      const { data, error } = await supabase
        .from('pet_documents')
        .insert({
          pet_id: input.petId,
          doc_type: input.docType,
          storage_key: storageKey,
          issued_date: input.issuedDate ?? null,
          expiry_date: input.expiryDate ?? null,
        })
        .select('*')
        .single();

      if (error) throw error;
      const doc = rowToPetDocument(data as PetDocumentRow);
      setDocuments((prev) => [doc, ...prev]);
      return doc;
    },
    [],
  );

  const deleteDocument = useCallback(async (doc: PetDocument) => {
    const { error } = await supabase.from('pet_documents').delete().eq('id', doc.id);
    if (error) throw error;
    await removePetMedia(doc.storageKey);
    setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
  }, []);

  return { documents, isReady, loadDocuments, uploadDocument, deleteDocument };
}
