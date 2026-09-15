import { useParams } from 'react-router-dom';
import PostForm from './PostForm.jsx';

export default function EditPost() {
  const { id } = useParams();
  return (
    <>
      <h1 className="admin-h1">Edit Post</h1>
      <PostForm postId={id} />
    </>
  );
}
