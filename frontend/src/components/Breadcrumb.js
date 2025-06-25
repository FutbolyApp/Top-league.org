import React from 'react';
import styled from 'styled-components';
import { Link, useLocation } from 'react-router-dom';

const BreadcrumbContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem 2rem;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
`;

const BreadcrumbItem = styled.span`
  color: white;
  font-size: 0.9rem;
  font-weight: 500;
`;

const BreadcrumbLink = styled(Link)`
  color: white;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: opacity 0.2s;
  
  &:hover {
    opacity: 0.8;
    text-decoration: underline;
  }
`;

const Separator = styled.span`
  color: white;
  margin: 0 0.5rem;
  opacity: 0.7;
`;

const Breadcrumb = ({ items }) => {
  if (!items || items.length === 0) return null;

  return (
    <BreadcrumbContainer>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <Separator>›</Separator>}
          {item.link ? (
            <BreadcrumbLink to={item.link}>
              {item.label}
            </BreadcrumbLink>
          ) : (
            <BreadcrumbItem>
              {item.label}
            </BreadcrumbItem>
          )}
        </React.Fragment>
      ))}
    </BreadcrumbContainer>
  );
};

export default Breadcrumb; 